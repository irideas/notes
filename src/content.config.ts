import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: z.string(),
    tags: z.array(z.string().min(1)).max(2).default([]),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    coverCredit: z.string().optional(),
  }),
});

export const collections = { notes };
