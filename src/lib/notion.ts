/**
 * Reads Mike's Jobs out of Notion.
 *
 * Used two ways:
 *  - at request time by src/pages/jobs.astro, so the page is always live
 *  - by scripts/fetch-jobs.mjs, which refreshes the committed fallback snapshot
 */

export type Job = {
  date: string;
  iso: string;
  role: string;
  company: string;
  location: string;
  by: string;
  url: string;
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const plain = (prop: any): string => {
  const arr = prop?.title ?? prop?.rich_text ?? [];
  return arr.map((t: any) => t.plain_text).join('').trim();
};

const linkOf = (prop: any): string => {
  const arr = prop?.rich_text ?? prop?.title ?? [];
  for (const t of arr) if (t.href) return t.href;
  return '';
};

export async function fetchJobs(token: string, databaseId: string): Promise<Job[]> {
  const db = databaseId.replace(/-/g, '');
  const headers = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  const rows: Job[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${db}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
        sorts: [{ property: 'Date Posted', direction: 'descending' }],
      }),
    });
    if (!res.ok) {
      throw new Error(`Notion ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data: any = await res.json();

    for (const r of data.results) {
      const p = r.properties ?? {};
      const status = p.Status?.select?.name ?? 'Active';
      if (status.toLowerCase() === 'closed') continue;

      const iso = p['Date Posted']?.date?.start ?? '';
      const d = iso ? new Date(iso) : null;
      rows.push({
        date: d ? `${MON[d.getUTCMonth()]} ${d.getUTCDate()}` : '',
        iso,
        role: plain(p['Role(s)'] ?? p.Roles ?? p.Role),
        company: plain(p.Company),
        location: plain(p.Location) || '—',
        by: plain(p['LI Poster Name'] ?? p['Posted by']),
        url: linkOf(p['LI Poster Name'] ?? p['Post URL']),
      });
    }
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  rows.sort((a, b) => (b.iso || '').localeCompare(a.iso || ''));
  return rows;
}
