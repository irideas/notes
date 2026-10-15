import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { domainNames } from './lib/domains';
import { isInstant, isActor, metadataErrors } from './lib/content-metadata.mjs';

const nonempty = z.string().trim().min(1);
const instant = z.string().refine(isInstant, '时间须含秒和明确时区');
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  // Only standard OKF fields; Article is this project's chosen type value.
  schema: z.object({
    type: z.literal('Article'), title: nonempty, description: nonempty,
    tags: z.array(z.enum(domainNames)).max(2).default([]).refine(tags => new Set(tags).size === tags.length, '领域关键词不能重复'),
    generated: z.object({ by: nonempty.refine(isActor, '编辑者使用 human:id、process:id、工具名或工具名/模型名'), at: instant }).strict(),
    sources: z.array(z.object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      resource: z.string().url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol)),
      title: nonempty, author: nonempty.optional(),
    }).strict()).default([]),
  }).strict().superRefine((note, context) => {
    for (const message of metadataErrors(note)) context.addIssue({ code: z.ZodIssueCode.custom, message });
  }),
});
export const collections = { notes };
