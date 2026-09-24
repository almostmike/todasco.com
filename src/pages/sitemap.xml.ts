const PAGES = ['', 'newsletter', 'periodic-fables', 'humor', 'ai-at-the-movies',
  'research', 'patents', 'media', 'built', 'jobs', 'about', 'press'];

import { transcripts, transcriptPath } from '../lib/transcripts';

export async function GET() {
  const base = 'https://todasco.com';
  // lastmod is the build date. Google largely ignores changefreq but does use
  // lastmod to schedule recrawls, so it is worth emitting honestly.
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map((p) =>
    `  <url><loc>${base}/${p}</loc><lastmod>${lastmod}</lastmod><changefreq>${p === '' || p === 'jobs' ? 'daily' : 'monthly'}</changefreq></url>`
  ).concat(
    transcripts.length ? [`  <url><loc>${base}/media/transcripts</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq></url>`] : [],
    transcripts.map((t) => `  <url><loc>${base}${transcriptPath(t)}</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq></url>`)
  ).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
