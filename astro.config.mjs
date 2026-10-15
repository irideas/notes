import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://notes.irideas.pro',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
