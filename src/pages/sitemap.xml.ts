import { allNotes, groupedMonths, noteUrl, monthUrl, tagUrl } from '../lib/notes';
export async function GET({ site }) {
  const notes = await allNotes();
  const paths = ['/', '/archive/', '/about/', ...notes.map(noteUrl), ...groupedMonths(notes).map(({ month }) => monthUrl(month)), ...[...new Set(notes.flatMap(note => note.data.tags))].map(tagUrl)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${new URL(path, site).href.replace(/&/g, '&amp;')}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
