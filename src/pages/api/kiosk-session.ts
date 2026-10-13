import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { HUB_SYNC_TOKEN } from 'astro:env/server';

export const prerender = false;

const store = () => getStore({ name: 'family-time-left', region: 'us-east-2' });

function authorized(request: Request) {
  const expected = HUB_SYNC_TOKEN;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!expected || !supplied) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST({ request }: { request: Request }) {
  if (!HUB_SYNC_TOKEN) {
    return Response.json({ error: 'Dashboard sync is not configured.' }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let input: unknown;
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 16_384) return Response.json({ error: 'Payload too large.' }, { status: 413 });
    input = await request.json();
  } catch {
    return Response.json({ error: 'Expected JSON.' }, { status: 400 });
  }

  const body = input as { updatedAt?: unknown; sessions?: unknown };
  if (typeof body?.updatedAt !== 'string' || !Number.isFinite(Date.parse(body.updatedAt)) || !Array.isArray(body.sessions)) {
    return Response.json({ error: 'Invalid dashboard snapshot.' }, { status: 400 });
  }

  const sessions = body.sessions.flatMap((value) => {
    if (!value || typeof value !== 'object') return [];
    const session = value as Record<string, unknown>;
    const profileName = typeof session.profileName === 'string' ? session.profileName.trim() : '';
    const scheduledEndAt = typeof session.scheduledEndAt === 'string' ? session.scheduledEndAt : '';
    const startedAt = typeof session.startedAt === 'string' ? session.startedAt : '';
    if (!['Connor', 'Sydney'].includes(profileName) || !Number.isFinite(Date.parse(scheduledEndAt))) return [];
    return [{
      profileName,
      activityName: typeof session.activityName === 'string' ? session.activityName.slice(0, 40) : 'Activity',
      declaredDescription: typeof session.declaredDescription === 'string' ? session.declaredDescription.slice(0, 100) : '',
      startedAt: Number.isFinite(Date.parse(startedAt)) ? startedAt : null,
      scheduledEndAt
    }];
  });

  await store().setJSON('active-sessions', { updatedAt: body.updatedAt, sessions });
  return Response.json({ ok: true });
}
