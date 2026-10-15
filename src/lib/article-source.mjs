import { parse as yaml } from 'yaml';
import { markdownToMdast } from 'satteri';
import { execFileSync } from 'node:child_process';

export function parseDocument(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return { data: match ? yaml(match[1]) : {}, body: match ? source.slice(match[0].length) : source };
}
export async function coverFromBody(body) {
  const tree = await markdownToMdast(body || '');
  const first = tree.children[0];
  if (first?.type !== 'paragraph' || first.children.length !== 1 || first.children[0].type !== 'image') return null;
  const image = first.children[0];
  return { path: image.url, alt: image.alt, credit: image.title };
}
const creationCache = new Map();
export function createdAtFor(id, root = process.cwd()) {
  const path = `src/content/notes/${id}.md`;
  const key = `${root}:${path}`;
  if (creationCache.has(key)) return creationCache.get(key);
  try {
    const value = execFileSync('git', ['log','--follow','--diff-filter=A','--format=%cI','--',path], { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim().split('\n').filter(Boolean).at(-1) || null;
    if (value) creationCache.set(key,value);
    return value;
  } catch { return null; }
}
