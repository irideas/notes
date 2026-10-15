import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import diagrams from './src/lib/markdown-diagrams.mjs';
import { sourceFootnotes, footnoteLabels, coverImage } from './src/lib/source-footnotes.mjs';

export default defineConfig({
  site: 'https://notes.irideas.pro',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: { processor: satteri({ mdastPlugins: [coverImage, diagrams, sourceFootnotes], hastPlugins: [footnoteLabels] }) },
});
