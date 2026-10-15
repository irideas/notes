import { stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createdAtFor, coverFromBody } from '../src/lib/article-source.mjs';
import { isInstant, rawUrl, displayOffset } from '../src/lib/content-metadata.mjs';

const text = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join('');
export async function checkArticles({root,dist,noteRoot,markdown,pages,report}) {
  try { await stat(resolve(dist,'raw')); report(dist,'The site must not build its own raw directory'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const [file,doc] of markdown) {
    if (!file.startsWith(`${noteRoot}/`)) continue;
    const id = relative(noteRoot,file).replaceAll('\\','/').replace(/\.md$/,'');
    const pageFile = resolve(dist,id,'index.html');
    const page = pages.get(pageFile);
    if (!page) { report(file,'Missing rendered article'); continue; }
    for (const id of doc.ids) if (!page.ids.has(id)) report(pageFile,`Article heading missing from rendered content: ${id}`);
    const raw = rawUrl(id);
    if (!page.links.includes(raw)) report(pageFile,'Missing same-language GitHub Raw link');
    if (!page.tags.some(tag => tag.name === 'link' && tag.a.rel === 'alternate' && tag.a.type === 'text/markdown' && tag.a.href === raw)) report(pageFile,'Missing GitHub Markdown discovery link');
    if (page.links.some(link => /github\.com\/irideas\/notes\/commits?\//.test(link) || link.startsWith('/raw/'))) report(pageFile,'Article must not expose commit links or a site-owned raw route');
    const created = createdAtFor(id,root);
    if (process.env.GITHUB_ACTIONS && !created) report(file,'Full Git history is required to derive creation time');
    for (const instant of [created,doc.data.generated?.at].filter(Boolean)) {
      if (!isInstant(instant)) report(file,`Invalid timezone timestamp: ${instant}`);
      if (!page.tags.some(tag => tag.name === 'time' && tag.a.datetime === instant)) report(pageFile,`Missing metadata time: ${instant}`);
    }
    if (!text(page.document).includes(displayOffset)) report(pageFile,'Missing timezone offset');
    for (const source of doc.data.sources || []) if (!page.links.includes(source.resource)) report(pageFile,`Source link not rendered: ${source.id}`);
    const image = await coverFromBody(doc.body);
    if (image && page.tags.filter(tag => tag.name === 'img' && tag.a.alt === image.alt).length !== 1) report(pageFile,'Cover must appear exactly once');
    const jsonLd = page.tags.find(tag => tag.name === 'script' && tag.a.type === 'application/ld+json');
    if (!jsonLd) { report(pageFile,'Missing Article JSON-LD'); continue; }
    let schema;
    try { schema = JSON.parse(text(jsonLd.node)); } catch { continue; } // Reported by the page checker.
    if (schema.dateModified !== doc.data.generated.at || schema.dateCreated !== (created || undefined)) report(pageFile,'JSON-LD times differ from content and Git history');
    if (schema.encoding?.contentUrl !== raw) report(pageFile,'JSON-LD Raw URL differs from GitHub source');
  }
}
