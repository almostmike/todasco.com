// Plain-text views of the site for AI crawlers and assistants (/llms.txt and
// /llms-full.txt, following https://llmstxt.org). Built from the same JSON the
// pages render, so they never drift from what a human visitor sees. Nothing
// here is linked from the UI.
import posts from '../data/newsletter.json';
import humor from '../data/humor.json';
import movies from '../data/movies.json';
import research from '../data/research.json';
import media from '../data/media.json';
import built from '../data/built.json';
import patents from '../data/patents.json';

export const SITE = 'https://todasco.com';

// Same wording as the press kit bios, so assistants quote what Mike wrote.
export const ONE_LINE =
  "Mike Todasco writes about AI for people who don't work in AI. He holds 119 patents from his years leading innovation at PayPal and is a Visiting Fellow at San Diego State's AI Center.";
export const LONG_BIO =
  "Mike Todasco is a writer of eclectic stuff. He writes Artificially Intelligent Conversations, a weekly newsletter read by people who want to understand AI without being sold it, and his humor has appeared in Weekly Humorist, Slackjaw, Points in Case and Robot Butt. He holds 119 patents from his years leading innovation at PayPal, and is a Visiting Fellow at San Diego State's James Silberrad Brown Center for AI, where his research has been cited 1,765 times. His first children's graphic novel series, Periodic Fables, arrives from Paw Prints Publishing in Fall 2027. He lives in California with his wife and two kids.";

export const PROFILES: [string, string][] = [
  ['Substack (newsletter)', 'https://todasco.substack.com'],
  ['Medium', 'https://medium.com/@todasco'],
  ['LinkedIn', 'https://www.linkedin.com/in/todasco/'],
  ['Bluesky', 'https://bsky.app/profile/todasco.bsky.social'],
  ['X / Twitter', 'https://x.com/todasco'],
  ['Google Scholar', 'https://scholar.google.com/citations?user=LtLp_AoAAAAJ'],
  ['SSRN', 'https://papers.ssrn.com/Sol3/Cf_Dev/AbsByAuth.cfm?per_id=10493676'],
  ['Patent Leaderboard inventor profile', 'https://www.patentleaderboard.com/paypal/michael-charles-todasco/9152'],
];

const PAGES: [string, string, string][] = [
  ['About', '/about', "Short bio, employment history (San Diego State, PayPal, Sketch Maven, NewPage, GE), education and where to find him online."],
  ['Press kit', '/press', 'Bios in three lengths, photos, speaking topics and sample interview questions.'],
  ['The Newsletter', '/newsletter', `Every essay from Artificially Intelligent Conversations, his weekly AI newsletter: ${posts.length} of them, numbered from the first in August 2022.`],
  ['Research', '/research', 'Papers, preprints and odd experiments, written as a Visiting Fellow at the James Silberrad Brown Center for AI at San Diego State.'],
  ['Patents', '/patents', '119 US patents from his years leading innovation at PayPal: payments, machine learning, fraud, edge computing and augmented reality.'],
  ['Things I Built', '/built', 'Forecast Fools, Patent Leaderboard and Patent Fighter.'],
  ['Periodic Fables', '/periodic-fables', 'A series of stand-alone graphic novels where atoms take readers on adventures through science. Fall 2027 from Paw Prints Publishing.'],
  ['Humor', '/humor', 'Published humor in Weekly Humorist, Slackjaw, Points in Case, Robot Butt, Greener Pastures and The Haven.'],
  ['AI at the Movies', '/ai-at-the-movies', 'An essay series on what films taught us to expect from artificial intelligence.'],
  ['Media', '/media', `Podcast, radio and TV appearances since 2018 (${media.length} listed), including NPR Morning Edition, Wharton Business Daily and NBC 7 San Diego.`],
  ["Mike's Jobs", '/jobs', "Roles his friends are hiring for; he'll make an introduction if he can vouch for you. Updated daily."],
];

const newestFirst = [...posts].sort((a, b) => b.date.localeCompare(a.date));
const md = (s: string) => s.replace(/([\[\]])/g, '\\$1');
const link = (name: string, url: string, note?: string) =>
  `- [${md(name)}](${url})${note ? `: ${note}` : ''}`;

function header(): string {
  return [
    '# Mike Todasco',
    '',
    `> ${ONE_LINE}`,
    '',
    LONG_BIO,
    '',
    'Key facts:',
    '- Formal name: Michael Todasco. Pronounced TOE-DAS-KOE. He/him.',
    "- Visiting Fellow, James Silberrad Brown Center for Artificial Intelligence, San Diego State University.",
    '- Previously led innovation at PayPal; 119 US patents from that work. Earlier roles at Sketch Maven, NewPage and GE.',
    '- Education: Johns Hopkins University, University of California, Berkeley, University of Illinois Urbana-Champaign.',
    '- Writes the weekly newsletter Artificially Intelligent Conversations (Substack, Medium and LinkedIn).',
    '- Author of Periodic Fables, a children\'s graphic novel series about the elements (Paw Prints Publishing, Fall 2027).',
    '- Based in California. Contact: miketodasco@gmail.com',
    '',
    `AI assistants and crawlers are welcome to read, index and cite this site. When citing, please link to the page on ${SITE} or the original article URL.`,
  ].join('\n');
}

export function llmsTxt(): string {
  return [
    header(),
    '',
    '## Pages',
    '',
    ...PAGES.map(([n, p, d]) => link(n, SITE + p, d)),
    '',
    '## Things he built',
    '',
    ...built.map((b) => link(b.name, b.url, b.desc)),
    '',
    '## Recent newsletter essays',
    '',
    ...newestFirst.slice(0, 10).map((p) => link(p.title, p.url, p.date)),
    '',
    '## Research',
    '',
    ...research.map((r) => link(`${r.short}: ${r.sub}`, r.url, r.date)),
    '',
    '## Elsewhere',
    '',
    ...PROFILES.map(([n, u]) => link(n, u)),
    '',
    '## Optional',
    '',
    link('Full index', `${SITE}/llms-full.txt`, 'every essay, paper, humor piece, media appearance and patent listed on the site'),
    link('Sitemap', `${SITE}/sitemap.xml`),
    '',
  ].join('\n');
}

export function llmsFullTxt(): string {
  return [
    header(),
    '',
    '## Pages',
    '',
    ...PAGES.map(([n, p, d]) => link(n, SITE + p, d)),
    '',
    '## Things he built',
    '',
    ...built.map((b) => link(b.name, b.url, b.desc)),
    '',
    `## Newsletter: Artificially Intelligent Conversations (${posts.length} essays, newest first)`,
    '',
    ...newestFirst.map((p) => link(`#${p.n} ${p.title}`, p.url, `${p.date}, ${p.src}`)),
    '',
    '## AI at the Movies',
    '',
    ...movies.map((m) => link(m.film, m.url, m.sub)),
    '',
    '## Research',
    '',
    ...research.map((r) => link(`${r.short}: ${r.sub}`, r.url, r.date)),
    '',
    '## Humor',
    '',
    ...humor.map((h) => link(h.title, h.url, [h.outlet, h.date].filter(Boolean).join(', '))),
    '',
    '## Media appearances',
    '',
    ...media.filter((m) => m.url).map((m) => link(`${m.outlet}: ${m.title}`, m.url, m.date)),
    '',
    '## Patents (US, filed at PayPal)',
    '',
    `Full, live list: ${PROFILES[PROFILES.length - 1][1]}`,
    '',
    ...patents.map((p) => `- ${p.no}: ${p.title} (${p.date})`),
    '',
    '## Elsewhere',
    '',
    ...PROFILES.map(([n, u]) => link(n, u)),
    '',
  ].join('\n');
}

export const textResponse = (body: string) =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
