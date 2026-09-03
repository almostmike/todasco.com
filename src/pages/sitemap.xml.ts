const PAGES = ['', 'newsletter', 'periodic-fables', 'humor', 'ai-at-the-movies',
  'research', 'patents', 'media', 'built', 'jobs', 'about', 'press'];

export async function GET() {
  const base = 'https://todasco.com';
  const urls = PAGES.map((p) =>
    `  <url><loc>${base}/${p}</loc><changefreq>${p === '' || p === 'jobs' ? 'daily' : 'monthly'}</changefreq></url>`
  ).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
