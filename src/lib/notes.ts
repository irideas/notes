import { getCollection, type CollectionEntry } from 'astro:content';

export const siteTitle = '记点儿信息';
export const siteDescription = '梳理概念与模型，分析系统、组织与人类活动中的机制和变化，形成有依据、可修正的判断。';

export async function allNotes() {
  return (await getCollection('notes')).sort((a, b) => b.data.date.localeCompare(a.data.date) || a.id.localeCompare(b.id));
}

export const noteUrl = (note: CollectionEntry<'notes'>) => `/${note.id}/`;
export const tagUrl = (tag: string) => `/tags/${encodeURIComponent(tag)}/`;
export const monthUrl = (month: string) => `/archive/${month.replace('-', '/')}/`;
export const monthTitle = (month: string) => `${month.slice(0, 4)} 年 ${Number(month.slice(5, 7))} 月`;
export const displayDate = (date: string) => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' }).format(new Date(`${date}T12:00:00+08:00`));

export function readingTime(body: string = '') {
  const chinese = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (body.replace(/[\u4e00-\u9fff]/g, '').match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.ceil(chinese / 450 + words / 220));
}

export function groupedMonths(notes: CollectionEntry<'notes'>[]) {
  return [...new Set(notes.map(note => note.data.date.slice(0, 7)))].map(month => ({ month, notes: notes.filter(note => note.data.date.startsWith(month)) }));
}
