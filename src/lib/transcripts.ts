// Auto-generated interview transcripts (one JSON file per episode in
// src/data/transcripts/). They exist so text-only readers - search engines and
// AI assistants - can read what Mike said in podcast and video appearances.
// Nothing in the human-facing UI links here; they are reachable through the
// sitemap, /llms.txt and /llms-full.txt.
export type Turn = { speaker: string; start: number; paragraphs: string[] };
export type Transcript = {
  slug: string; outlet: string; title: string; date: string; published?: string;
  url: string; duration_sec?: number; host?: string; speakers: string[];
  turns: Turn[]; words: number;
};

const files = import.meta.glob<Transcript>('../data/transcripts/*.json', { eager: true, import: 'default' });

export const transcripts: Transcript[] = Object.values(files).sort((a, b) =>
  (b.published ?? '').localeCompare(a.published ?? ''));

export const transcriptPath = (t: Transcript) => `/media/transcripts/${t.slug}`;

export const clock = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

export const NOTE =
  'This is an auto-generated transcript, made with speech recognition and lightly cleaned up for readability (filler words and false starts removed). Speaker labels were assigned automatically, so a brief interjection can occasionally land inside the other speaker\'s turn. The original recording is the authoritative version.';

export const transcriptText = (t: Transcript) =>
  t.turns.map((u) => `[${clock(u.start)}] ${u.speaker}: ${u.paragraphs.join('\n\n')}`).join('\n\n');
