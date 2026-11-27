import type { PracticeSession } from '@/store/state';
import { mondayOf } from '@/features/records-settings/logic';

export const MIN_SETS = 3; // 다음 주 단계를 제안하려면 이번 주 최소 훈련 세트 수

/** 이번 주(월요일부터) 훈련 세트 수 · 훈련한 날 수 · 정답률 */
export function weekStats(sessions: PracticeSession[], now = new Date()) {
  const from = mondayOf(now).getTime();
  const week = sessions.filter((s) => s.task === 'training' && Date.parse(s.at) >= from && Date.parse(s.at) <= now.getTime());
  const total = week.reduce((n, s) => n + s.total, 0);
  const correct = week.reduce((n, s) => n + s.correct, 0);
  const days = new Set(week.map((s) => new Date(s.at).toDateString())).size;
  return { sets: week.length, days, accuracy: total ? correct / total : 0 };
}

/**
 * 다음 주 추천 레벨 (A안 동적 난이도 ±1에 조건을 붙임)
 * - 이번 주 훈련 3세트 미만: 바꾸지 않음
 * - 정답률 85% 이상: +1 · 50% 미만: −1 · 그 사이: 유지 (1–10 안에서)
 * 제안일 뿐이고, 단계를 바꾸는 건 본인이 정한다.
 */
export function nextWeekLevel(level: number, sets: number, accuracy: number) {
  if (sets < MIN_SETS) return { level, change: 0 as const };
  const next = Math.min(10, Math.max(1, level + (accuracy >= 0.85 ? 1 : accuracy < 0.5 ? -1 : 0)));
  return { level: next, change: (next - level) as -1 | 0 | 1 };
}
