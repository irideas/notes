import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownToMdast } from 'satteri';
import { parse, parseFragment } from 'parse5';
import GithubSlugger from 'github-slugger';
import config from '../astro.config.mjs';
import { discussionConfig, discussionFor, validateDiscussions } from '../src/lib/discussions.mjs';
import { parseDocument, coverFromBody } from '../src/lib/article-source.mjs';
import { checkArticles } from './check-articles.mjs';
import { checkSeo } from './check-seo.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const site = new URL(config.site);
const errors = [];
const report = (file, message) => errors.push(`${relative(root, file)}: ${message}`);
const exists = async path => { try { return await stat(path); } catch { return null; } };
async function files(directory, suffix) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path, suffix));
    else if (path.endsWith(suffix)) result.push(path);
  }
  return result;
}
function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
  if (node.content) walk(node.content, visit);
}
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
const attributes = node => Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
function htmlInfo(source) {
  const document = parse(source);
  const ids = new Set(); const duplicateIds = []; const links = []; const fragments = [];
  const tags = []; const alternates = new Map(); let lang; let canonical;
  walk(document, node => {
    if (!node.tagName) return;
    const a = attributes(node); tags.push({ name: node.tagName, a, node });
    if (a.id) { if (ids.has(a.id)) duplicateIds.push(a.id); ids.add(a.id); }
    if (node.tagName === 'html') lang = a.lang;
    if (['a','link'].includes(node.tagName) && a.href) links.push(a.href);
    if (['script','img','source'].includes(node.tagName) && a.src) links.push(a.src);
    if (a.srcset) for (const candidate of a.srcset.split(',')) links.push(candidate.trim().split(/\s+/)[0]);
    if (a.href?.startsWith('#')) fragments.push(a.href.slice(1));
    for (const value of Object.values(a)) {
      for (const match of value.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)) {
        if (match[1].startsWith('#')) fragments.push(match[1].slice(1)); else links.push(match[1]);
      }
    }
    if (node.tagName === 'link' && a.rel === 'canonical') canonical = a.href;
    if (node.tagName === 'link' && a.rel === 'alternate' && a.hreflang) alternates.set(a.hreflang, a.href);
  });
  return { document, ids, duplicateIds, links, fragments, tags, lang, canonical, alternates };
}
async function markdownInfo(source) {
  const {data,body} = parseDocument(source);
  const tree = await markdownToMdast(body);
  const ids = new Set(); const links = []; const slugger = new GithubSlugger();
  const footnotes = new Set(); const references = new Set(); const definitions = new Map(); const linkReferences = [];
  const structure = { h2: 0, h3: 0, tables: 0, diagrams: 0 };
  let h1 = 0;
  const label = node => node.type === 'html' ? text(parseFragment(node.value)) : node.value || (node.children || []).map(label).join('');
  const visit = token => {
    if (token.type === 'heading') {
      ids.add(slugger.slug(label(token)));
      if (token.depth === 1) h1++;
      if (token.depth === 2) structure.h2++;
      if (token.depth === 3) structure.h3++;
    }
    if (token.type === 'table') structure.tables++;
    if (token.type === 'code' && token.lang?.split(/\s+/)[0] === 'mermaid') structure.diagrams++;
    if (['link','image'].includes(token.type)) links.push(token.url);
    if (token.type === 'definition') definitions.set(token.identifier, token.url);
    if (['linkReference','imageReference'].includes(token.type)) linkReferences.push(token.identifier);
    if (token.type === 'footnoteDefinition') footnotes.add(token.identifier);
    if (token.type === 'footnoteReference') references.add(token.identifier);
    if (token.type === 'text') for (const match of token.value.matchAll(/\[\^([^\]]+)\]/g)) references.add(match[1]);
    if (token.type === 'html') walk(parseFragment(token.value), node => {
      const a = attributes(node);
      if (a.id) ids.add(a.id);
      if (a.href) links.push(a.href);
      if (a.src) links.push(a.src);
    });
    for (const child of token.children || []) visit(child);
  };
  visit(tree);
  for (const id of linkReferences) if (definitions.has(id)) links.push(definitions.get(id));
  return { data, body, ids, links, h1, structure, footnotes, references };
}
async function publicTarget(url) {
  const path = resolve(dist, `.${decodeURIComponent(url.pathname)}`);
  if (relative(dist,path).startsWith('..')) return null;
  const info = await exists(path);
  if (info?.isFile()) return path;
  const index = resolve(path,'index.html');
  return (await exists(index))?.isFile() ? index : null;
}
const pages = new Map();
for (const path of await files(dist,'.html')) pages.set(path, htmlInfo(await readFile(path,'utf8')));
async function publicLink(file, href, base) {
  if (!href || /^(data|mailto|tel|javascript):/i.test(href)) return;
  let url;
  try { url = new URL(href,base); } catch { report(file,`Invalid URL: ${href}`); return; }
  if (url.origin !== site.origin) return;
  const target = await publicTarget(url);
  if (!target) { report(file,`Missing site target: ${href}`); return; }
  if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) report(file,`Missing site anchor: ${href}`);
}
for (const [file,page] of pages) {
  const path = `/${relative(dist,file).replaceAll('\\','/').replace(/index\.html$/,'')}`;
  const url = new URL(path,site);
  if (page.tags.filter(t => t.name === 'h1').length !== 1) report(file,'Expected exactly one H1');
  if (page.duplicateIds.length) report(file,`Duplicate IDs: ${page.duplicateIds.join(', ')}`);
  if (!page.tags.some(t => t.name === 'title' && text(t.node).trim())) report(file,'Missing title');
  if (!page.tags.some(t => t.name === 'meta' && t.a.name === 'description' && t.a.content?.trim())) report(file,'Missing meta description');
  if (page.canonical !== url.href) report(file,`Canonical must reference this page: ${url.href}`);
  const expectedLang = path.startsWith('/en/') ? 'en' : 'zh-CN';
  if (page.lang !== expectedLang) report(file,`Expected html lang=${expectedLang}`);
  const expectedFeed = expectedLang === 'en' ? '/en/rss.xml' : '/rss.xml';
  if (!page.tags.some(t => t.name === 'link' && t.a.type === 'application/rss+xml' && t.a.href === expectedFeed)) report(file,'RSS discovery link does not match page language');
  if (page.alternates.get(expectedLang) !== url.href) report(file,'Missing self hreflang');
  for (const lang of ['zh-CN','en']) {
    const href = page.alternates.get(lang);
    if (!href) report(file,`Missing ${lang} hreflang`);
    else {
      const target = await publicTarget(new URL(href));
      if (!target || pages.get(target)?.alternates.get(expectedLang) !== url.href) report(file,`Non-reciprocal ${lang} hreflang`);
    }
  }
  for (const href of page.links) await publicLink(file,href,url);
  for (const id of page.fragments) if (!page.ids.has(id)) report(file,`Missing SVG/fragment ID: ${id}`);
  for (const tag of page.tags) {
    if (tag.name === 'img' && !tag.a.alt?.trim()) report(file,'Image needs nonempty alternative text');
    if (tag.name === 'code' && tag.a.class?.includes('language-mermaid')) report(file,'Unrendered Mermaid block');
    if (tag.name === 'script' && tag.a.type === 'application/ld+json') {
      try { JSON.parse(text(tag.node)); } catch { report(file,'Invalid JSON-LD'); }
    }
  }
  if (/\bDIKW\b/.test(text(page.document))) report(file,'Internal DIKW framework leaked into a page');
  if (page.tags.some(t => t.a.id === 'theme-toggle')) report(file,'Theme toggle must not replace the language control');
}
const noteRoot = resolve(root,'src/content/notes');
const markdownFiles = [...['README.md','AGENTS.md','CONTRIBUTING.md'].map(f => resolve(root,f)), ...await files(resolve(root,'docs'),'.md'), ...await files(resolve(root,'.github'),'.md'), ...await files(noteRoot,'.md')];
const markdown = new Map(); const pairs = new Map();
for (const path of markdownFiles) {
  try { markdown.set(path,await markdownInfo(await readFile(path,'utf8'))); } catch (error) { report(path,`Cannot parse Markdown/frontmatter: ${error.message}`); }
}
for (const [file,doc] of markdown) {
  const isNote = file.startsWith(`${noteRoot}/`);
  if (isNote) {
    const path = relative(noteRoot,file).replaceAll('\\','/');
    const match = path.match(/^(en\/)?(\d{4})\/(\d{2})\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/);
    if (!match) report(file,'Expected [en/]YYYY/MM/lowercase-slug.md');
    else {
      const key = `${match[2]}/${match[3]}/${match[4]}`;
      const pair = pairs.get(key) || {};
      pair[match[1] ? 'en' : 'zh-CN'] = {file,doc}; pairs.set(key,pair);
    }
    if (doc.h1) report(file,'Article body must start below H1');
    const sources = new Set((doc.data.sources || []).map(source => source.id));
    for (const id of doc.references) {
      if (!doc.footnotes.has(id)) report(file,`Missing footnote definition: ${id}`);
      if (!sources.has(id)) report(file,`Footnote has no sources entry: ${id}`);
    }
    for (const id of doc.footnotes) if (!doc.references.has(id)) report(file,`Unused footnote definition: ${id}`);
    for (const id of sources) if (!doc.references.has(id)) report(file,`Source has no claim attribution: ${id}`);
  }
  for (const href of doc.links) {
    if (!href || /^(https?:|mailto:|tel:|data:|\/\/)/i.test(href)) {
      if (href?.startsWith(site.origin)) await publicLink(file,href,site);
      continue;
    }
    if (isNote && (href.startsWith('/') || href.startsWith('#'))) {
      const base = new URL(`/${relative(noteRoot,file).replace(/\.md$/,'')}/`,site);
      await publicLink(file,href,base); continue;
    }
    const fragmentAt = href.indexOf('#');
    const pathname = decodeURIComponent((fragmentAt < 0 ? href : href.slice(0,fragmentAt)).split('?')[0]);
    const fragment = fragmentAt < 0 ? '' : decodeURIComponent(href.slice(fragmentAt+1));
    const target = pathname ? resolve(pathname.startsWith('/') ? root : dirname(file), `.${pathname.startsWith('/') ? pathname : `/${pathname}`}`) : file;
    if (!(await exists(target))) report(file,`Missing repository target: ${href}`);
    else if (fragment && markdown.has(target) && !markdown.get(target).ids.has(fragment)) report(file,`Missing Markdown anchor: ${href}`);
  }
}
for (const [key,pair] of pairs) {
  if (!pair.en || !pair['zh-CN']) { report(noteRoot,`Missing language counterpart for ${key}`); continue; }
  const a = pair['zh-CN']; const b = pair.en;
  const sourceIdentity = doc => (doc.data.sources || []).map(({id,resource}) => ({id,resource})).sort((a,b) => a.id.localeCompare(b.id));
  if (JSON.stringify(sourceIdentity(a.doc)) !== JSON.stringify(sourceIdentity(b.doc))) report(b.file,'Paired source IDs, resources or publication dates differ');
  if (JSON.stringify(a.doc.data.tags || []) !== JSON.stringify(b.doc.data.tags || [])) report(b.file,'Paired domain keys differ');
  const cover = async item => { const image = await coverFromBody(item.doc.body); return image ? resolve(dirname(item.file),image.path) : null; };
  if (await cover(a) !== await cover(b)) report(b.file,'Language editions must share the same cover asset');
  if (a.doc.data.sources?.[0]?.id !== b.doc.data.sources?.[0]?.id) report(b.file,'Language editions must keep the same primary source first');
  if (JSON.stringify(a.doc.structure) !== JSON.stringify(b.doc.structure)) report(b.file,'Headings, tables or diagram counts differ between editions');
}
for (const error of validateDiscussions(new Set(pairs.keys()))) report(resolve(root,'src/data/discussions.json'), error);
for (const [key, pair] of pairs) {
  if (!Number.isSafeInteger(discussionConfig.articles[key])) continue;
  const discussion = discussionFor(key);
  for (const locale of ['zh-CN', 'en']) {
    const file = resolve(dist, locale === 'en' ? `en/${key}/index.html` : `${key}/index.html`);
    const page = pages.get(file);
    if (!page || !pair[locale]) continue;
    const widgets = page.tags.filter(t => t.name === 'script' && t.a.src === 'https://giscus.app/client.js');
    if (widgets.length !== 1) { report(file,'Expected one giscus widget'); continue; }
    const attrs = widgets[0].a;
    for (const [attribute, value] of Object.entries({
      'data-repo': discussionConfig.repository, 'data-repo-id': discussionConfig.repositoryId,
      'data-category': discussionConfig.category, 'data-category-id': discussionConfig.categoryId,
      'data-mapping': 'number', 'data-term': String(discussion.number),
      'data-lang': locale, 'data-theme': 'light', 'data-loading': 'lazy', 'data-reactions-enabled': '1',
    })) if (attrs[attribute] !== value) report(file,`Invalid giscus ${attribute}`);
    if (!page.tags.some(t => t.name === 'section' && t.a['data-article-key'] === key)) report(file,'Missing canonical article key on discussion section');
    if (!page.links.includes(discussion.url)) report(file,'Missing direct GitHub discussion link');
  }
}
for (const pathname of ['rss.xml','en/rss.xml','sitemap.xml']) {
  const file = resolve(dist,pathname);
  if (!(await exists(file))) { report(file,'Missing feed/sitemap'); continue; }
  const source = await readFile(file,'utf8');
  if (!source.startsWith('<?xml')) report(file,'Missing XML declaration');
  for (const match of source.matchAll(/<(?:loc|link)>([^<]+)<\/(?:loc|link)>/g)) await publicLink(file,match[1].replaceAll('&amp;','&'),site);
  if (pathname.endsWith('rss.xml')) {
    const english = pathname.startsWith('en/');
    if (!source.includes(`<language>${english ? 'en' : 'zh-cn'}</language>`)) report(file,'Feed language mismatch');
    for (const match of source.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)) if (new URL(match[1]).pathname.startsWith('/en/') !== english) report(file,'Mixed languages in feed');
  }
}
await checkArticles({root,dist,noteRoot,markdown,pages,report});
await checkSeo({dist,site,pages,report,publicLink});
if (errors.length) {
  console.error(`Project checks failed (${errors.length}):\n${errors.map(e => `- ${e}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(`Project checks passed: ${markdown.size} Markdown files, ${pages.size} pages, ${pairs.size} bilingual article pair(s), standard OKF fields, GitHub Raw links, timezone metadata, citations, feeds, assets and anchors.`);
