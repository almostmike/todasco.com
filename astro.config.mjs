import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://todasco.com',
  // Everything is prerendered except the pages that opt out with
  // `export const prerender = false` — right now that's just /jobs,
  // which reads Notion on every request so the board is always live.
  output: 'static',
  adapter: netlify(),
  build: { inlineStylesheets: 'auto' },
  // Declared as secrets so they are read from the host's environment at request
  // time rather than inlined into the build. Optional: without them /jobs falls
  // back to the committed snapshot instead of failing the build.
  env: {
    schema: {
      NOTION_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      NOTION_DATABASE_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
