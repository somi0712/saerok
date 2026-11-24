import type { ModuleId } from '@/store/state';

export interface Answer {
  m: ModuleId;
  correct: boolean;
  seconds: number;
  hint: boolean;
}

/** 속도: 5초 이내 1, 30초 이상 0, 그 사이는 직선으로 줄어듦 */
export const speedOf = (seconds: number) => Math.min(1, Math.max(0, (30 - seconds) / 25));

/** 100점 = 문항마다 (100 / 문항 수) × [정답이면 0.7 + 0.2 × 속도 + 0.1 × 힌트 미사용, 오답이면 0] */
export function scoreOf(answers: Answer[]): number {
  if (!answers.length) return 0;
  const per = 100 / answers.length;
  const total = answers.reduce(
    (sum, a) => (a.correct ? sum + per * (0.7 + 0.2 * speedOf(a.seconds) + 0.1 * (a.hint ? 0 : 1)) : sum),
    0,
  );
  return Math.round(total);
}

/** 0–10 → 1단계, 11–20 → 2단계 … 91–100 → 10단계 */
export const levelOf = (score: number) => Math.min(10, Math.max(1, Math.ceil(score / 10)));
