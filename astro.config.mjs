import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import diagrams from './src/lib/markdown-diagrams.mjs';

export default defineConfig({
  site: 'https://notes.irideas.pro',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  markdown: { processor: satteri({ mdastPlugins: [diagrams] }) },
});
