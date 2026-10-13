import { getStore } from '@netlify/blobs';
import {
  FIREWALLA_API_TOKEN,
  FIREWALLA_BOX_GID,
  FIREWALLA_CONNOR_USER_ID,
  FIREWALLA_MSP_DOMAIN,
  FIREWALLA_SYDNEY_USER_ID,
} from 'astro:env/server';

export const prerender = false;

type Rule = {
  id?: string;
  gid?: string;
  action?: string;
  name?: string;
  notes?: string;
  scope?: { type?: string; value?: string; name?: string };
  target?: { type?: string; value?: string | string[]; name?: string };
  timeUsage?: { quota?: number; used?: number };
};

const emptySessions = { updatedAt: null, sessions: [] };

function bucketFor(rule: Rule): 'internet' | 'youtube' | 'gaming' | null {
  const type = rule.target?.type?.toLowerCase() ?? '';
  const values = Array.isArray(rule.target?.value)
    ? rule.target.value.map((value) => String(value).toLowerCase())
    : [String(rule.target?.value ?? '').toLowerCase()];
  const label = `${rule.name ?? ''} ${rule.notes ?? ''} ${rule.target?.name ?? ''}`.toLowerCase();
  if (type === 'internet' || label.includes('internet time')) return 'internet';
  if ((type === 'app' && values.includes('youtube')) || label.includes('youtube')) return 'youtube';
  const games = new Set(['games', 'fortnite', 'roblox', 'leagueoflegends', 'minecraft']);
  if ((type === 'category' && values.includes('games')) || (type === 'app' && values.some((value) => games.has(value))) || label.includes('gaming')) {
    return 'gaming';
  }
  return null;
}

function profileFor(rule: Rule): 'Connor' | 'Sydney' | null {
  if (rule.scope?.type?.toLowerCase() !== 'user') return null;
  const id = rule.scope.value ?? '';
  const text = `${rule.scope.name ?? ''} ${rule.name ?? ''} ${rule.notes ?? ''}`.toLowerCase();
  if ((FIREWALLA_CONNOR_USER_ID && id === FIREWALLA_CONNOR_USER_ID) || text.includes('connor')) return 'Connor';
  if ((FIREWALLA_SYDNEY_USER_ID && id === FIREWALLA_SYDNEY_USER_ID) || text.includes('sydney')) return 'Sydney';
  return null;
}

function usageLabel(rule: Rule): string {
  const target = rule.target;
  const value = Array.isArray(target?.value) ? target.value.join(', ') : String(target?.value ?? '');
  if (target?.type === 'internet') return 'Internet';
  if (target?.type === 'category' && value.toLowerCase() === 'games') return 'All games';
  return target?.name || value || 'Time limit';
}

function summarize(rules: Rule[]) {
  const people = ['Connor', 'Sydney'] as const;
  const buckets = ['internet', 'youtube', 'gaming'] as const;
  return Object.fromEntries(people.map((name) => [name, Object.fromEntries(buckets.map((bucket) => {
    const matching = rules.filter((rule) => profileFor(rule) === name && rule.action?.toLowerCase() === 'timelimit' && bucketFor(rule) === bucket && rule.timeUsage);
    if (!matching.length) return [bucket, null];
    const quotaMinutes = matching.reduce((sum, rule) => sum + Number(rule.timeUsage?.quota ?? 0), 0);
    const usedMinutes = matching.reduce((sum, rule) => sum + Number(rule.timeUsage?.used ?? 0), 0);
    return [bucket, {
      quotaMinutes,
      usedMinutes,
      remainingMinutes: Math.max(0, quotaMinutes - usedMinutes),
      limitNames: [...new Set(matching.map(usageLabel))]
    }];
  }))]));
}

export async function GET({ request }: { request: Request }) {
  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  const diagnostic = Boolean(HUB_SYNC_TOKEN && request.headers.get('x-dashboard-diagnostic-token') === HUB_SYNC_TOKEN);
  if (!FIREWALLA_MSP_DOMAIN || !FIREWALLA_API_TOKEN || !FIREWALLA_BOX_GID) {
    return Response.json({ error: 'Firewalla reporting is not configured.', profiles: null, sessions: emptySessions }, { status: 503, headers });
  }
  if (!FIREWALLA_CONNOR_USER_ID || !FIREWALLA_SYDNEY_USER_ID) {
    return Response.json({ error: 'Connor and Sydney Firewalla User IDs are not configured.', profiles: null, sessions: emptySessions }, { status: 503, headers });
  }

  try {
    const base = FIREWALLA_MSP_DOMAIN.startsWith('http') ? FIREWALLA_MSP_DOMAIN : `https://${FIREWALLA_MSP_DOMAIN}`;
    const rulesUrl = new URL('/v2/rules', base);
    rulesUrl.searchParams.set('query', `box.id:${FIREWALLA_BOX_GID}`);
    const firewallaResponse = await fetch(rulesUrl, {
      headers: { Authorization: `Token ${FIREWALLA_API_TOKEN}` },
      signal: AbortSignal.timeout(8_000)
    });
    if (!firewallaResponse.ok) {
      console.error('[time-left] Firewalla request failed:', firewallaResponse.status);
      return Response.json({ error: 'Could not read Firewalla time limits.', profiles: null, sessions: emptySessions }, { status: 502, headers });
    }

    const payload = await firewallaResponse.json() as { results?: Rule[] } | Rule[];
    const rules = Array.isArray(payload) ? payload : payload.results ?? [];
    if (diagnostic) {
      return Response.json({ rules: rules.filter((rule) => rule.timeUsage).map(({ id, action, scope, target, timeUsage }) => ({ id, action, scope, target, timeUsage })) }, { headers });
    }
    const snapshot = await getStore({ name: 'family-time-left', region: 'us-east-2' }).get('active-sessions', { type: 'json' }) as { updatedAt?: string; sessions?: unknown[] } | null;
    const isFresh = Boolean(snapshot?.updatedAt && Date.now() - Date.parse(snapshot.updatedAt) < 120_000);
    const sessions = isFresh ? snapshot : emptySessions;
    const diagnostics = {
      rules: rules.length,
      timeLimitRules: rules.filter((rule) => rule.action?.toLowerCase() === 'timelimit').length,
      scopedTypes: [...new Set(rules.map((rule) => rule.scope?.type ?? 'all'))],
      targetTypes: [...new Set(rules.map((rule) => rule.target?.type ?? 'unknown'))],
      usageFields: rules.filter((rule) => rule.timeUsage).length
    };
    return Response.json({ updatedAt: new Date().toISOString(), profiles: summarize(rules), sessions, diagnostics }, { headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    console.error('[time-left] Failed to load data:', detail);
    return Response.json({ error: diagnostic ? detail : 'Could not load the time-left dashboard.', profiles: null, sessions: emptySessions }, { status: 502, headers });
  }
}
