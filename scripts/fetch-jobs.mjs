/**
 * Refreshes the committed fallback snapshot at src/data/jobs.json.
 *
 *   npm run jobs
 *
 * The live site does NOT depend on this — /jobs reads Notion on every request.
 * This snapshot is only what gets shown if Notion is unreachable at request
 * time, so it's worth re-running occasionally to keep the fallback current.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'src', 'data', 'jobs.json');

const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TOKEN = process.env.NOTION_TOKEN;
const DB = process.env.NOTION_DATABASE_ID;
if (!TOKEN || !DB) {
  console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID. See .env.example, or npm run jobs:check');
  process.exit(1);
}

// one implementation, shared with the live page
const { fetchJobs } = await import(pathToFileURL(path.join(ROOT, 'src', 'lib', 'notion.ts')).href)
  .catch(async () => {
    // node can't import .ts directly on older runtimes — fall back to a tiny inline copy
    const src = fs.readFileSync(path.join(ROOT, 'src', 'lib', 'notion.ts'), 'utf8')
      .replace(/^import[^\n]*\n/gm, '')
      .replace(/export type Job = \{[\s\S]*?\};\n/, '')
      .replace(/: Promise<Job\[\]>/g, '').replace(/: Job\[\]/g, '')
      .replace(/: any/g, '').replace(/: string/g, '').replace(/\| undefined/g, '');
    const mod = new Function('return (async () => { ' + src + ' return { fetchJobs }; })()');
    return await mod();
  });

const rows = await fetchJobs(TOKEN, DB);
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1), 'utf8');
console.log(`wrote ${rows.length} open roles to src/data/jobs.json (fallback snapshot)`);
