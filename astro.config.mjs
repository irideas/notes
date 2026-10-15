import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import diagrams from './src/lib/markdown-diagrams.mjs';
import { sourceFootnotes, footnoteLabels } from './src/lib/source-footnotes.mjs';
import rawBundle from './src/lib/raw-bundle.mjs';

export default defineConfig({
  site: 'https://notes.irideas.pro',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  integrations: [rawBundle()],
  markdown: { processor: satteri({ mdastPlugins: [diagrams, sourceFootnotes], hastPlugins: [footnoteLabels] }) },
});
