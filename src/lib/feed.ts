import rss from '@astrojs/rss';
import { allNotes, noteUrl } from './notes';
import { ui, homeUrl, type Locale } from './i18n';
export async function feed(locale: Locale, site: URL) {
  const notes = await allNotes(locale);
  const t = ui(locale);
  return rss({title:t.siteTitle,description:t.siteDescription,site:new URL(homeUrl(locale),site),items:notes.map(note => ({title:note.data.title,description:note.data.description,link:noteUrl(note)})),customData:`<language>${locale === 'en' ? 'en' : 'zh-cn'}</language>`});
}
