import { getCollection, type CollectionEntry } from 'astro:content';
import { localeOf, prefix, ui, type Locale } from './i18n';
import { domains } from './domains';
export const siteTitle = ui('zh-CN').siteTitle;
export const siteDescription = ui('zh-CN').siteDescription;
export async function allNotes(locale: Locale | 'all' = 'zh-CN') {
  return (await getCollection('notes')).filter(note => locale === 'all' || localeOf(note.id) === locale)
    .sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}
export const noteUrl = (note: CollectionEntry<'notes'>) => `/${note.id}/`;
export const tagUrl = (tag: keyof typeof domains, locale: Locale = 'zh-CN') => `${prefix(locale)}/tags/${locale === 'en' ? domains[tag].slug : encodeURIComponent(tag)}/`;
export const monthUrl = (month: string, locale: Locale = 'zh-CN') => `${prefix(locale)}/archive/${month.replace('-', '/')}/`;
export const monthTitle = (month: string, locale: Locale = 'zh-CN') => locale === 'en' ? new Intl.DateTimeFormat('en', {month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${month}-01T12:00:00Z`)) : `${month.slice(0,4)} 年 ${Number(month.slice(5,7))} 月`;
export const displayDate = (date: string, locale: Locale = 'zh-CN') => new Intl.DateTimeFormat(locale, {year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Shanghai'}).format(new Date(`${date}T12:00:00+08:00`));
export function readingTime(body: string = '') {
  const chinese = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (body.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.ceil(chinese / 450 + words / 220));
}
export function groupedMonths(notes: CollectionEntry<'notes'>[]) {
  return [...new Set(notes.map(note => note.data.date.slice(0,7)))].map(month => ({month,notes:notes.filter(note => note.data.date.startsWith(month))}));
}
