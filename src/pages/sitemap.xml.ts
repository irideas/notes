import { allNotes, groupedMonths, noteUrl, monthUrl, tagUrl } from '../lib/notes';
import { locales, prefix, alternatePath } from '../lib/i18n';
export async function GET({ site }) {
  const paths: string[] = [];
  for (const locale of locales) {
    const notes = await allNotes(locale);
    paths.push(`${prefix(locale)}/`,`${prefix(locale)}/archive/`,`${prefix(locale)}/about/`,...notes.map(noteUrl),...groupedMonths(notes).map(({month}) => monthUrl(month,locale)),...[...new Set(notes.flatMap(note => note.data.tags))].map(tag => tagUrl(tag,locale)));
  }
  const url = (path: string) => new URL(path,site).href.replace(/&/g,'&amp;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.map(path => `<url><loc>${url(path)}</loc>${locales.map(locale => `<xhtml:link rel="alternate" hreflang="${locale}" href="${url(alternatePath(path,locale))}"/>`).join('')}</url>`).join('')}</urlset>`;
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
