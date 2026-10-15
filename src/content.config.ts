import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { domainNames } from './lib/domains';
import { isDate, isInstant, isActor, metadataErrors } from './lib/content-metadata.mjs';

const date = z.string().refine(isDate, '日期必须是真实的 YYYY-MM-DD 字符串');
const instant = z.string().refine(isInstant, '时间须含秒和明确时区，例如 2026-10-15T18:00:00+08:00');
const nonempty = z.string().trim().min(1);
const sourceId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const webUrl = z.string().url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol));

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  // This publishing profile is stricter than general OKF conformance.
  schema: ({ image }) => z.object({
    type: z.literal('Article'),
    title: nonempty,
    language: z.enum(['zh-CN', 'en']),
    date,
    created_at: instant.optional(),
    first_recorded_at: instant.optional(),
    first_recorded_commit: z.string().regex(/^[a-f0-9]{40}$/).optional(),
    generated: z.object({ by: nonempty.refine(isActor, '编辑者使用 human:id、process:id 或 producer/version'), at: instant }).strict(),
    asOf: date.optional(),
    description: nonempty,
    tags: z.array(z.enum(domainNames)).max(2).default([]).refine(tags => new Set(tags).size === tags.length, '领域关键词不能重复'),
    primary_source: sourceId.optional(),
    sources: z.array(z.object({
      id: sourceId,
      resource: webUrl,
      title: nonempty,
      author: nonempty.optional(),
      author_name: nonempty.optional(),
      publication: nonempty.optional(),
      published_on: date.optional(),
    }).strict()).default([]),
    revision: nonempty.optional(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    coverCredit: z.string().optional(),
  }).strict().superRefine((note, context) => {
    for (const message of metadataErrors(note)) context.addIssue({ code: z.ZodIssueCode.custom, message });
    if (note.cover && (!note.coverAlt?.trim() || !note.coverCredit?.trim())) context.addIssue({ code: z.ZodIssueCode.custom, message: '有封面时必须填写替代文本与来源说明' });
  }),
});

export const collections = { notes };
