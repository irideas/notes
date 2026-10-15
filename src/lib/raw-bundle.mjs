import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parse as yaml } from 'yaml';
import { markdownToMdast } from 'satteri';
import { okfVersion } from './content-metadata.mjs';

export function parseDocument(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return { data: match ? yaml(match[1]) : {}, body: match ? source.slice(match[0].length) : source };
}
export async function listFiles(directory) {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) result.push(...await listFiles(path));
    else if (item.isFile()) result.push(path);
    else throw new Error(`Unsupported symbolic link in content: ${path}`);
  }
  return result.sort();
}
export function buildVersion(root) {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: root, encoding: 'utf8' }).trim();
  return { revision, dirty };
}
export const sourceVersionUrl = (id, version) => !version.dirty
  ? `https://raw.githubusercontent.com/irideas/notes/${version.revision}/src/content/notes/${id}.md` : undefined;

const inside = (root, path) => path === root || (!relative(root, path).startsWith('..') && !relative(root, path).startsWith('/'));
const escapeLabel = value => value.replace(/[\[\]\\]/g, '\\$&').replace(/\s+/g, ' ');

export async function bundleFiles(root) {
  const content = resolve(root, 'src/content/notes');
  const output = new Map();
  const documents = new Map();
  for (const file of (await listFiles(content)).filter(path => path.endsWith('.md'))) {
    const source = await readFile(file);
    const key = relative(content, file).replaceAll('\\', '/');
    output.set(key, source);
    const doc = parseDocument(source.toString('utf8'));
    documents.set(key, doc);
    const assets = doc.data.cover ? [doc.data.cover] : [];
    const tree = await markdownToMdast(doc.body);
    const definitions = new Map(); const imageReferences = [];
    const walk = node => {
      if (node.type === 'image') assets.push(node.url);
      if (node.type === 'definition') definitions.set(node.identifier, node.url);
      if (node.type === 'imageReference') imageReferences.push(node.identifier);
      for (const child of node.children || []) walk(child);
    };
    walk(tree);
    for (const id of imageReferences) if (definitions.has(id)) assets.push(definitions.get(id));
    for (const asset of assets) {
      if (/^https?:\/\//.test(asset)) continue;
      if (!asset.startsWith('./') && !asset.startsWith('../')) throw new Error(`Use a relative local image path in ${key}: ${asset}`);
      const target = resolve(dirname(file), decodeURIComponent(asset.split(/[?#]/)[0]));
      if (!inside(content, target) || !['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'].includes(extname(target))) throw new Error(`Image must stay inside the content bundle: ${key}: ${asset}`);
      output.set(relative(content, target).replaceAll('\\', '/'), await readFile(target));
    }
  }
  const directories = new Set(['']);
  for (const key of documents.keys()) {
    let folder = dirname(key);
    while (folder !== '.') { directories.add(folder); folder = dirname(folder); }
  }
  for (const folder of directories) {
    const english = folder === 'en' || folder.startsWith('en/');
    const lines = folder ? [] : ['---', `okf_version: "${okfVersion}"`, '---', ''];
    lines.push(`# ${folder === 'en' ? 'English' : folder || 'Notes · 记点儿信息'}`, '');
    const childFolders = [...directories].filter(candidate => candidate && (dirname(candidate) === (folder || '.'))).sort();
    if (!folder) lines.push('## 简体中文', '');
    for (const child of childFolders) {
      if (!folder && child === 'en') lines.push('', '## English', '');
      const label = child === 'en' ? 'English' : child.split('/').at(-1);
      lines.push(`- [${label}](${relative(folder || '.', child)}/index.md)`);
    }
    for (const [key, doc] of documents) if (dirname(key) === (folder || '.')) {
      lines.push(`- [${escapeLabel(doc.data.title)}](${relative(folder || '.', key)}) — ${escapeLabel(doc.data.description)}`);
    }
    if (!folder) lines.push('', 'Full articles in Simplified Chinese and English. Open a language/year/month index before selecting an article.', '', '完整文章按语言与年月组织。Markdown 与阅读页面来自同一次构建。', '', '[Website / 阅读网站](https://notes.irideas.pro/) · [Usage / 使用说明](https://github.com/irideas/notes#维护与使用)');
    // Index links stay relative to the bundle, including the route back to its root.
    else lines.push('', `[${english ? 'Bundle index' : '知识包入口'}](${relative(folder, '.') || '.'}/index.md)`);
    output.set(`${folder ? `${folder}/` : ''}index.md`, Buffer.from(`${lines.join('\n')}\n`));
  }
  output.set('build.json', Buffer.from(`${JSON.stringify(buildVersion(root), null, 2)}\n`));
  return output;
}

export default function rawBundle() {
  let root;
  return {
    name: 'notes-raw-bundle',
    hooks: {
      'astro:config:done': ({ config }) => { root = fileURLToPath(config.root); },
      'astro:build:done': async ({ dir }) => {
        const destination = resolve(fileURLToPath(dir), 'raw');
        for (const [key, bytes] of await bundleFiles(root)) {
          const file = resolve(destination, key);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, bytes);
        }
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use('/raw', async (request, response, next) => {
          try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).slice(1);
            const key = !pathname || pathname.endsWith('/') ? `${pathname}index.md` : pathname;
            const files = await bundleFiles(root);
            if (!files.has(key)) return next();
            const types = { '.md': 'text/markdown; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' };
            response.setHeader('Content-Type', types[extname(key)] || 'application/octet-stream');
            response.setHeader('Cache-Control', 'no-store');
            response.end(files.get(key));
          } catch (error) { next(error); }
        });
      },
    },
  };
}
