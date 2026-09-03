# todasco.com

The wall-chart site. Astro, static output, no framework runtime shipped to the browser.

## Run it

Because the folder path contains `&`, npm's shim scripts break on Windows. Call Astro
through node directly:

```bash
cd "10_Source" && node ./node_modules/astro/astro.js dev
```

Then open http://localhost:4321.

Other commands, same pattern:

```bash
node ./node_modules/astro/astro.js build
```

```bash
node ./node_modules/astro/astro.js preview
```

There is also a launch config at `../.claude/launch.json`, so an agent session can start the
dev server by name (`todasco`) without the path problem.

## What's where

```
src/
  layouts/Base.astro        head, meta, fonts, JSON-LD, the sheet frame
  components/
    PageHeader.astro        breadcrumb + element tile + prose + Character Mike
    PageFooter.astro        the bottom rule
  pages/                    one file per route
  data/                     all content as JSON — edit these, not the pages
  styles/global.css         every token and shared rule
public/img/                 WebP art, 388 KB for the whole site
```

## Editing content

Everything data-driven lives in `src/data/`:

| File | Holds | Notes |
|---|---|---|
| `newsletter.json` | 110 essays, numbered 1–110 | from the Medium archive + 3 LinkedIn originals |
| `media.json` | 56 appearances | `media_tags.json` drives the filter chips |
| `humor.json` | 10 pieces, in Mike's ranking | `art` is a filename in `public/img`, or `""` for a reserved plate |
| `movies.json` | 10 film essays | `film` is the plate, `sub` the line under it |
| `research.json` | 7 papers | all seven have plates in `public/img/res-*.webp` |
| `built.json` | 3 sites | |
| `jobs.json` | fallback snapshot only | `/jobs` reads Notion live; this is the backup — see below |
| `patents.json` / `patent_years.json` | 118 filings, from the CSV | unused since the year chart came out |

Page copy that isn't data lives inline in each `.astro` file, near the top.

## How /jobs stays live

Every page is prerendered except `/jobs`, which sets `export const prerender = false` and reads
Notion on each request — so a row saved by the browser extension is on the site immediately, with
no rebuild. Responses carry `s-maxage=120, stale-while-revalidate=600`, so bursts of traffic hit
the CDN rather than Notion.

If Notion is unreachable the page falls back to `src/data/jobs.json` and shows a quiet "showing
last saved board" note instead of an empty table. Refresh that fallback occasionally with
`npm run jobs`; `npm run jobs:check` verifies the token and the database connection separately.

**In production this needs `NOTION_TOKEN` and `NOTION_DATABASE_ID` set in the host's environment
variables**, not just in `.env`.

## Still to wire up

- **Newsletter is a snapshot.** Regenerate from Substack RSS plus the Medium archive rather than
  re-parsing the saved profile by hand.
- **Article URLs.** Newsletter, humor, film and research rows all link to real articles now.
- **Press kit** lives at `/press`; the low-res headshot there wants replacing with a full-size original.
- **Substack signup** posts to `https://todasco.substack.com/subscribe`. Swap for the official
  embed if you want the inline confirmation flow.

## Deploying

Deployed to **Netlify** via the `@astrojs/netlify` adapter. `astro build` writes the static
pages to `dist/` and the on-demand `/jobs` route to `.netlify/v1/functions/ssr`.

Cloudflare is not an option from this laptop: `@astrojs/cloudflare` depends on `wrangler` →
`workerd`, and Cloudflare ships no `workerd` build for Windows on ARM, so the adapter cannot
even load the Astro config here. Vercel works but its free Hobby tier is licensed for
non-commercial personal use only.

Point todasco.com at Netlify directly rather than redirecting, and keep redirects from the
old `todasco.lovable.app` paths so existing links survive.
