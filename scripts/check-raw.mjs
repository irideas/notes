import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, dirname, basename } from 'node:path';
import { markdownToMdast } from 'satteri';
import { listFiles, parseDocument, bundleFiles, sourceVersionUrl } from '../src/lib/raw-bundle.mjs';
import { isInstant, metadataErrors, rawUrl, okfVersion, displayOffset } from '../src/lib/content-metadata.mjs';

const nodeText = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(nodeText).join('');

export async function checkRaw({root,dist,noteRoot,markdown,pages,report}) {
  const directory = resolve(dist,'raw');
  let actual;
  try { actual = await listFiles(directory); } catch { report(directory,'Missing raw bundle'); return; }
  const expected = await bundleFiles(root);
  const version = JSON.parse(await readFile(resolve(directory,'build.json'),'utf8'));
  for (const [key, bytes] of expected) {
    const file = resolve(directory,key);
    try { if (!bytes.equals(await readFile(file))) report(file,'Raw artifact differs from its source/build index'); }
    catch { report(file,'Missing raw document or image'); }
  }
  for (const file of actual) if (!expected.has(relative(directory,file).replaceAll('\\','/'))) report(file,'Unexpected raw artifact');

  for (const file of actual.filter(path => path.endsWith('.md'))) {
    const source = await readFile(file,'utf8');
    const {data,body} = parseDocument(source);
    const key = relative(directory,file).replaceAll('\\','/');
    const reserved = ['index.md','log.md'].includes(basename(file));
    if (basename(file) === 'index.md') {
      const keys = Object.keys(data);
      if (key === 'index.md') {
        if (keys.length !== 1 || data.okf_version !== okfVersion) report(file,'Bundle root index must declare only okf_version');
      } else if (keys.length) report(file,'Subdirectory indexes must have no frontmatter');
    } else if (!reserved && (typeof data.type !== 'string' || !data.type.trim())) report(file,'OKF concept needs a nonempty type');

    const tree = await markdownToMdast(body);
    const links = [];
    const visit = node => {
      if (['link','image','definition'].includes(node.type)) links.push(node.url);
      for (const child of node.children || []) visit(child);
    };
    visit(tree);
    if (!reserved && data.cover) links.push(data.cover);
    for (const href of links) {
      if (!href || /^(https?:|mailto:|tel:|data:|\/\/|#)/i.test(href)) continue;
      const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
      const target = pathname.startsWith('/') ? resolve(directory,`.${pathname}`) : resolve(dirname(file),pathname);
      if (relative(directory,target).startsWith('..')) { report(file,`Raw link escapes bundle: ${href}`); continue; }
      try { if (!(await stat(target)).isFile()) report(file,`Raw link is not a file: ${href}`); }
      catch { report(file,`Broken raw link: ${href}`); }
    }
  }

  for (const [file,doc] of markdown) {
    if (!file.startsWith(`${noteRoot}/`)) continue;
    const id = relative(noteRoot,file).replaceAll('\\','/').replace(/\.md$/,'');
    const data = doc.data;
    for (const message of metadataErrors(data)) report(file,message);
    for (const value of [data.created_at,data.first_recorded_at,data.generated?.at].filter(Boolean)) if (!isInstant(value)) report(file,`Invalid timezone timestamp: ${value}`);
    const pageFile = resolve(dist,id,'index.html');
    const page = pages.get(pageFile);
    if (!page) { report(file,'Missing rendered article'); continue; }
    for (const id of doc.ids) if (!page.ids.has(id)) report(pageFile,`Article heading missing from rendered content: ${id}`);
    const raw = rawUrl(id);
    if (!page.links.includes(raw)) report(pageFile,'Missing visible same-language raw link');
    if (!page.tags.some(tag => tag.name === 'link' && tag.a.rel === 'alternate' && tag.a.type === 'text/markdown' && tag.a.href === new URL(raw,page.canonical).href)) report(pageFile,'Missing Markdown discovery link');
    for (const timestamp of [data.created_at || data.first_recorded_at,data.generated.at]) if (!page.tags.some(tag => tag.name === 'time' && tag.a.datetime === timestamp)) report(pageFile,`Missing exact metadata time: ${timestamp}`);
    if (!nodeText(page.document).includes(displayOffset)) report(pageFile,'Missing displayed timezone offset');
    for (const source of data.sources || []) if (!page.links.includes(source.resource)) report(pageFile,`Source link not rendered: ${source.id}`);
    const jsonLd = page.tags.find(tag => tag.name === 'script' && tag.a.type === 'application/ld+json');
    if (!jsonLd) { report(pageFile,'Missing Article JSON-LD'); continue; }
    const schema = JSON.parse(nodeText(jsonLd.node));
    if (schema.dateModified !== data.generated.at || schema.datePublished !== data.date || schema.dateCreated !== data.created_at) report(pageFile,'JSON-LD timestamps differ from source semantics');
    if (schema.encoding?.contentUrl !== new URL(raw,page.canonical).href) report(pageFile,'JSON-LD raw URL differs');
    const pinned = sourceVersionUrl(id,version);
    if (pinned && !page.links.includes(pinned)) report(pageFile,'Missing raw source pinned to the build commit');
  }
}
