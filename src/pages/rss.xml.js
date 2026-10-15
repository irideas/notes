import rss from '@astrojs/rss';
import { allNotes, noteUrl, siteTitle, siteDescription } from '../lib/notes';

export async function GET(context) {
  const notes = await allNotes();
  return rss({ title: siteTitle, description: siteDescription, site: context.site, items: notes.map(note => ({ title: note.data.title, description: note.data.description, pubDate: new Date(`${note.data.date}T12:00:00+08:00`), link: noteUrl(note) })), customData: '<language>zh-cn</language>' });
}
