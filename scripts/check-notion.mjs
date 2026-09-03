/**
 * Tells you whether the Notion setup is right, and which half is wrong if not.
 *
 *   npm run jobs:check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envPath = path.join(ROOT, '.env');

if (!fs.existsSync(envPath)) {
  console.error('✗ No .env file.\n  Run:  cp .env.example .env   then paste your token in.');
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const TOKEN = (process.env.NOTION_TOKEN || '').trim();
const DB = (process.env.NOTION_DATABASE_ID || '').replace(/-/g, '').trim();

if (!TOKEN || TOKEN.startsWith('ntn_xxxx')) {
  console.error('✗ NOTION_TOKEN is still the placeholder.\n' +
    '  Notion → Developer tools → Personal access tokens → ··· → Copy token');
  process.exit(1);
}
if (!DB) { console.error('✗ NOTION_DATABASE_ID is empty.'); process.exit(1); }

const H = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// 1 — is the token itself valid?
const me = await fetch('https://api.notion.com/v1/users/me', { headers: H });
if (me.status === 401) {
  console.error('✗ The token is not valid (401).\n' +
    '  It may be revoked, or truncated when pasted. Copy it again — it starts with ntn_.');
  process.exit(1);
}
if (!me.ok) {
  console.error(`✗ Unexpected ${me.status} from Notion:`, (await me.text()).slice(0, 200));
  process.exit(1);
}
const who = await me.json();
console.log(`✓ Token works — "${who.name ?? who.bot?.workspace_name ?? 'integration'}"`);

// 2 — can it actually see the Jobs database?
const db = await fetch(`https://api.notion.com/v1/databases/${DB}`, { headers: H });
if (db.status === 404) {
  console.error('\n✗ Token is valid but cannot see that database (404).\n' +
    '  This is the connection step, not the token:\n' +
    '  Open Mike\'s Jobs in Notion → ··· (top right) → Connections → add your integration.');
  process.exit(1);
}
if (!db.ok) {
  console.error(`✗ ${db.status} reading the database:`, (await db.text()).slice(0, 200));
  process.exit(1);
}
const meta = await db.json();
const title = (meta.title ?? []).map((t) => t.plain_text).join('') || '(untitled)';
console.log(`✓ Database reachable — "${title}"`);

// 3 — does it have the columns fetch-jobs.mjs expects?
const props = Object.keys(meta.properties ?? {});
console.log(`  columns: ${props.join(', ')}`);
const WANT = ['Role(s)', 'Date Posted', 'Company', 'Location', 'LI Poster Name', 'Status'];
const missing = WANT.filter((w) => !props.includes(w));
if (missing.length) {
  console.log(`\n! Not found, will be skipped: ${missing.join(', ')}`);
  console.log('  Not fatal — tell me the real column names and I will map them.');
} else {
  console.log('✓ All expected columns present');
}

// 4 — how many rows will actually publish?
const q = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
  method: 'POST', headers: H, body: JSON.stringify({ page_size: 100 }),
});
if (q.ok) {
  const data = await q.json();
  const open = data.results.filter(
    (r) => (r.properties?.Status?.select?.name ?? 'Active').toLowerCase() !== 'closed').length;
  console.log(`✓ ${data.results.length} rows readable (${open} open${data.has_more ? ', more on later pages' : ''})`);
}
console.log('\nAll good. Run:  npm run jobs');
