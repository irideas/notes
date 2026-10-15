import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { domainNames } from './lib/domains';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, '日期必须是真实的 YYYY-MM-DD 日期');

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: ({ image }) => z.object({
    title: z.string().trim().min(1),
    date,
    updated: date.optional(),
    asOf: date.optional(),
    description: z.string().trim().min(1),
    tags: z.array(z.enum(domainNames)).max(2).default([]).refine(tags => new Set(tags).size === tags.length, '领域关键词不能重复'),
    source: z.object({
      title: z.string().min(1),
      author: z.string().min(1),
      publication: z.string().min(1),
      date: date.optional(),
      url: z.string().url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol)),
    }).optional(),
    revision: z.string().trim().min(1).optional(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    coverCredit: z.string().optional(),
  }).strict().refine(note => !note.updated || note.updated >= note.date, '更新日期不能早于发布日期')
    .refine(note => !!note.revision === !!note.updated, '更新日期与修订说明必须成对填写')
    .refine(note => !note.cover || (!!note.coverAlt?.trim() && !!note.coverCredit?.trim()), '有封面时必须填写替代文本与来源说明'),
});

export const collections = { notes };
