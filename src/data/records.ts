import { database } from './announcements';
import type { Assessment, PracticeSession } from '@/store/state';

// 서버 보관 기록: supabase/migrations/20261127000200_records_admin.sql 의 practice_sessions·assessments.
// 표에 있는 칸만 보내고, 표의 검사 조건을 넘는 값은 고치거나 뺀다. 일기·사진·음성은 보내지 않는다.

type Client = NonNullable<typeof database>;

const TASKS = ['order', 'recall', 'training', 'check'] as const;
const BURDENS = ['easy', 'ok', 'hard'] as const;
const count = (n: unknown) => Math.max(0, Math.round(Number(n) || 0));
const clamp = (n: unknown, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(n) || 0)));
const validId = (id: unknown): id is string => typeof id === 'string' && id.length >= 1 && id.length <= 64;
const isoOrNull = (at: unknown) => {
  const time = typeof at === 'string' ? Date.parse(at) : NaN;
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

export interface SessionRow {
  user_id: string; id: string; at: string; task: PracticeSession['task'];
  correct: number; total: number; hints: number;
  strategy: string | null; burden: PracticeSession['burden'] | null; minutes: number | null;
}

export interface AssessmentRow {
  user_id: string; id: string; at: string; score: number; level: number; modules: Assessment['modules'];
}

/** 검사 조건을 맞출 수 없는 기록(잘못된 id·날짜·종류)은 null 로 빼고 올리지 않는다. */
export function toSessionRow(userId: string, s: PracticeSession): SessionRow | null {
  const at = isoOrNull(s.at);
  if (!validId(s.id) || !at || !TASKS.includes(s.task)) return null;
  return {
    user_id: userId, id: s.id, at, task: s.task,
    correct: count(s.correct), total: count(s.total), hints: count(s.hints),
    strategy: s.strategy ? s.strategy.slice(0, 40) : null,
    burden: s.burden && BURDENS.includes(s.burden) ? s.burden : null,
    minutes: s.minutes == null ? null : clamp(s.minutes, 0, 600),
  };
}

export function toAssessmentRow(userId: string, a: Assessment): AssessmentRow | null {
  const at = isoOrNull(a.at);
  if (!validId(a.id) || !at) return null;
  return { user_id: userId, id: a.id, at, score: clamp(a.score, 0, 100), level: clamp(a.level, 1, 10), modules: a.modules ?? {} };
}

export function fromSessionRow(r: SessionRow): PracticeSession {
  return {
    id: r.id, at: r.at, task: r.task, correct: r.correct, total: r.total, hints: r.hints,
    ...(r.strategy ? { strategy: r.strategy } : {}),
    ...(r.burden ? { burden: r.burden } : {}),
    ...(r.minutes != null ? { minutes: r.minutes } : {}),
  };
}

export function fromAssessmentRow(r: AssessmentRow): Assessment {
  return { id: r.id, at: r.at, score: r.score, level: r.level, modules: r.modules };
}

/** 서버에만 있는 기록을 이 기기 기록에 더한다. 같은 id 는 이 기기 것을 그대로 둔다. */
export function mergeById<T extends { id: string; at: string }>(local: T[], remote: T[]): T[] {
  const known = new Set(local.map((x) => x.id));
  const added = remote.filter((x) => !known.has(x.id));
  return added.length ? [...local, ...added].sort((a, b) => a.at.localeCompare(b.at)) : local;
}

// ponytail: 한 번에 최대 1000줄(Supabase 기본 한도)까지 읽는다. 한 사람 기록이 그보다 많아지면 range 로 나눠 읽는다.
export async function pullRecords(client: Client) {
  const [sessions, assessments] = await Promise.all([
    client.from('practice_sessions').select('user_id,id,at,task,correct,total,hints,strategy,burden,minutes'),
    client.from('assessments').select('user_id,id,at,score,level,modules'),
  ]);
  if (sessions.error) throw sessions.error;
  if (assessments.error) throw assessments.error;
  return {
    sessions: (sessions.data as SessionRow[]).map(fromSessionRow),
    assessments: (assessments.data as AssessmentRow[]).map(fromAssessmentRow),
  };
}

export async function uploadRecords(client: Client, userId: string, sessions: PracticeSession[], assessments: Assessment[]) {
  const sessionRows = sessions.map((s) => toSessionRow(userId, s)).filter((r): r is SessionRow => r !== null);
  const assessmentRows = assessments.map((a) => toAssessmentRow(userId, a)).filter((r): r is AssessmentRow => r !== null);
  if (sessionRows.length) {
    const { error } = await client.from('practice_sessions').upsert(sessionRows, { onConflict: 'user_id,id' });
    if (error) throw error;
  }
  if (assessmentRows.length) {
    const { error } = await client.from('assessments').upsert(assessmentRows, { onConflict: 'user_id,id' });
    if (error) throw error;
  }
}

/** 이 계정의 서버 보관 기록을 모두 지운다. 이 기기의 기록은 그대로 둔다. */
export async function deleteRecords(client: Client, userId: string) {
  const [sessions, assessments] = await Promise.all([
    client.from('practice_sessions').delete().eq('user_id', userId),
    client.from('assessments').delete().eq('user_id', userId),
  ]);
  if (sessions.error) throw sessions.error;
  if (assessments.error) throw assessments.error;
}
