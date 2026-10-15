import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rename, mkdir, rmdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as yaml } from 'yaml';
import siteConfig from '../astro.config.mjs';
import { discussionConfig as config, discussionMarker, discussionUrl, validateDiscussions } from '../src/lib/discussions.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = resolve(root, 'src/data/discussions.json');
const [owner, name] = config.repository.split('/');
const [command, key, ...options] = process.argv.slice(2);
const create = options.includes('--create');
const fields = 'number url title body category { id }';
function graphql(query, variables = {}) {
  const result = JSON.parse(execFileSync('gh', ['api', 'graphql', '--input', '-'], {
    cwd: root, input: JSON.stringify({ query, variables }), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 30000, maxBuffer: 16 * 1024 * 1024,
  }));
  if (result.errors?.length) throw new Error(result.errors.map(e => e.message).join('; '));
  return result.data;
}
async function edition(key, english = false) {
  const source = await readFile(resolve(root, 'src/content/notes', english ? 'en' : '.', `${key}.md`), 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Missing frontmatter: ${key}`);
  const data = yaml(match[1]);
  if (!data.title?.trim() || !data.description?.trim()) throw new Error(`Missing title/description: ${key}`);
  return data;
}
const articleUrls = key => [new URL(`/${key}/`, siteConfig.site).href, new URL(`/en/${key}/`, siteConfig.site).href];
function verifyThread(thread, key) {
  if (thread.category.id !== config.categoryId) throw new Error(`Wrong category for ${key}: #${thread.number}`);
  if (!thread.body.includes(discussionMarker(key))) throw new Error(`Missing article marker for ${key}: #${thread.number}`);
  for (const url of articleUrls(key)) if (!thread.body.includes(`](${url})`)) throw new Error(`Missing article backlink: ${url}`);
}
function repositoryState() {
  const { repository } = graphql(`query($owner:String!,$name:String!) {
    repository(owner:$owner,name:$name) { id isPrivate hasDiscussionsEnabled discussionCategories(first:100) { nodes { id name } } }
  }`, { owner, name });
  if (repository.id !== config.repositoryId || repository.isPrivate || !repository.hasDiscussionsEnabled) throw new Error('Repository must match the registry, be public and have Discussions enabled');
  if (repository.discussionCategories.nodes.length !== 1) throw new Error('Keep exactly one shared article discussion category; see the discussions guide.');
  if (!repository.discussionCategories.nodes.some(c => c.id === config.categoryId && c.name === config.category)) throw new Error('Discussion category ID/name does not match the registry');
}
function allThreads() {
  const threads = []; let after = null;
  do {
    const { repository } = graphql(`query($owner:String!,$name:String!,$after:String) {
      repository(owner:$owner,name:$name) { discussions(first:100,after:$after) { nodes { ${fields} } pageInfo { hasNextPage endCursor } } }
    }`, { owner, name, after });
    threads.push(...repository.discussions.nodes);
    after = repository.discussions.pageInfo.hasNextPage ? repository.discussions.pageInfo.endCursor : null;
  } while (after);
  return threads;
}
async function ensure() {
  if (!/^\d{4}\/\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key || '') || options.some(o => o !== '--create')) throw new Error('Usage: npm run discussion:ensure -- YYYY/MM/slug [--create]');
  const [zh, en] = await Promise.all([edition(key), edition(key, true)]);
  if (zh.date !== en.date || zh.date?.slice(0, 7) !== key.slice(0, 7).replace('/', '-')) throw new Error('Article dates must match each other and the path');
  repositoryState();
  const threads = allThreads();
  const matches = threads.filter(d => d.body.includes(discussionMarker(key)));
  if (matches.length > 1) throw new Error(`Multiple discussions have the marker for ${key}; resolve manually before continuing`);
  const number = config.articles[key];
  if (number !== undefined) {
    const thread = threads.find(d => d.number === number);
    if (!thread) throw new Error(`Registered discussion #${number} does not exist; do not silently replace it`);
    verifyThread(thread, key);
    console.log(`Reusing ${thread.url}`); return;
  }
  let thread = matches[0];
  if (thread) verifyThread(thread, key);
  if (!create) {
    console.log(thread ? `Found ${thread.url}. Run again with --create to record its number.` : `No discussion for ${key}. Run again with --create when publication is authorized.`);
    return;
  }
  if (!thread) {
    const [zhUrl, enUrl] = articleUrls(key);
    const body = `${discussionMarker(key)}\n\n[简体中文：${zh.title}](${zhUrl})\n\n${zh.description}\n\n[English: ${en.title}](${enUrl})\n\n${en.description}\n\n---\n\n中英文版本共用此讨论。欢迎补充依据、提出问题、分享相关实践；请注明涉及的段落。评论保留原文。\n\nBoth language editions share this discussion. Add evidence, ask questions, or share relevant experience; identify the passage you are referring to. Comments remain in their original language.\n`;
    ({ createDiscussion: { discussion: thread } } = graphql(`mutation($input:CreateDiscussionInput!) {
      createDiscussion(input:$input) { discussion { ${fields} } }
    }`, { input: { repositoryId: config.repositoryId, categoryId: config.categoryId, title: `${zh.title} / ${en.title}`, body } }));
    // An uncertain mutation outcome is never retried here. A later run recovers by marker.
  }
  verifyThread(thread, key);
  config.articles[key] = thread.number;
  config.articles = Object.fromEntries(Object.entries(config.articles).sort(([a], [b]) => a.localeCompare(b)));
  const temporary = `${registryPath}.tmp`;
  await writeFile(temporary, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, registryPath);
  console.log(`Recorded ${key} -> ${discussionUrl(thread.number)}`);
}
async function check() {
  if (key || options.length) throw new Error('Usage: npm run discussion:check');
  const errors = validateDiscussions(new Set(Object.keys(config.articles)));
  if (errors.length) throw new Error(errors.join('; '));
  repositoryState();
  const threads = allThreads();
  for (const [key, number] of Object.entries(config.articles)) {
    await Promise.all([edition(key), edition(key, true)]);
    const matches = threads.filter(d => d.body.includes(discussionMarker(key)));
    if (matches.length !== 1 || matches[0].number !== number) throw new Error(`Discussion marker/number is missing or duplicated: ${key}`);
    verifyThread(matches[0], key);
  }
  console.log(`Remote discussions verified: ${Object.keys(config.articles).length} shared article thread(s).`);
}
let lock;
try {
  if (command === 'ensure' && create) {
    const gitDir = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: root, encoding: 'utf8' }).trim();
    lock = resolve(root, gitDir, 'notes-discussions.lock');
    await mkdir(lock).catch(() => { lock = null; throw new Error('Discussion creation is already locked. Check for another running agent; see the discussions guide.'); });
    const latest = JSON.parse(await readFile(registryPath, 'utf8'));
    for (const field of ['repository', 'repositoryId', 'category', 'categoryId']) if (latest[field] !== config[field]) throw new Error('Discussion settings changed during startup; inspect the registry and run again.');
    config.articles = latest.articles;
  }
  if (command === 'ensure') await ensure();
  else if (command === 'check') await check();
  else throw new Error('Use discussion:ensure or discussion:check.');
} catch (error) {
  console.error(error.stderr?.toString().trim() || error.message);
  process.exitCode = 1;
} finally {
  if (lock) await rmdir(lock);
}
