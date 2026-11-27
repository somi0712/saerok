import type { ModuleId } from '@/store/state';

// 노션 「테스트&훈련」 A안 › 핵심 구현 수식. 영역 이름만 11/26 회의 결정(의미기억·일화기억·작업기억·시공간·언어유창성)을 따른다.

export interface Answer {
  m: ModuleId;
  correct: boolean;
  seconds: number;
  hint: boolean;
}

/** 적정 시간 T_o, 기준 제한 시간 T_m (11/26 회의: 답변 제한 15초) */
export const T_O = 5;
export const T_M = 15;
if (!(T_M > T_O)) throw new Error('제한 시간은 적정 시간보다 길어야 해요');

/** 속도 점수 = 1 − (T_a − T_o)/(T_m − T_o), 0~1로 제한. 적정 시간 안이면 1, 제한 시간을 넘으면 0. */
export const speedOf = (seconds: number) => Math.min(1, Math.max(0, 1 - (seconds - T_O) / (T_M - T_O)));

/** 자립도: 힌트 없이 정답 1.0 · 힌트 보고 정답 0.6 · 오답 0 */
export const autonomyOf = (a: Answer) => (!a.correct ? 0 : a.hint ? 0.6 : 1);

/** 영역 점수 S_i = (정답률×0.6 + 속도×0.25 + 자립도×0.15)×100. 속도는 맞힌 문항에만 준다. */
export function areaScore(answers: Answer[]): number {
  if (!answers.length) return 0;
  const avg = (f: (a: Answer) => number) => answers.reduce((s, a) => s + f(a), 0) / answers.length;
  const acc = avg((a) => (a.correct ? 1 : 0));
  const speed = avg((a) => (a.correct ? speedOf(a.seconds) : 0));
  return Math.round((acc * 0.6 + speed * 0.25 + avg(autonomyOf) * 0.15) * 100);
}

/** 종합 점수 가중치 — 일화기억·작업기억에 더 무게를 둔다 (합 1) */
export const WEIGHTS: Record<ModuleId, number> = { A: 0.15, B: 0.3, C: 0.25, D: 0.15, E: 0.15 };

export function areaScores(answers: Answer[]): Record<ModuleId, number> {
  return Object.fromEntries((Object.keys(WEIGHTS) as ModuleId[]).map((m) => [m, areaScore(answers.filter((a) => a.m === m))])) as Record<ModuleId, number>;
}

/** S_t = Σ 가중치 × S_i */
export const totalOf = (areas: Record<ModuleId, number>) =>
  Math.round((Object.keys(WEIGHTS) as ModuleId[]).reduce((s, m) => s + WEIGHTS[m] * areas[m], 0));

export const scoreOf = (answers: Answer[]) => (answers.length ? totalOf(areaScores(answers)) : 0);

/** L_t = ⌈S_t/10⌉, 0점은 1단계 */
export const levelOf = (score: number) => Math.min(10, Math.max(1, Math.ceil(score / 10)));

/** 취약 영역: 점수가 가장 낮은 두 영역 (같으면 가중치가 큰 영역 먼저) */
export const weakAreas = (areas: Record<ModuleId, number>): ModuleId[] =>
  (Object.keys(WEIGHTS) as ModuleId[]).sort((a, b) => areas[a] - areas[b] || WEIGHTS[b] - WEIGHTS[a]).slice(0, 2);

export interface Course {
  questions: number; // 1회 문항 수
  freq: string;
  minutes: string;
  difficulty: string;
}

/** 종합 레벨 → 훈련 강도·주기 (A안 훈련 메커니즘 매핑) */
export function courseOf(level: number): Course {
  if (level <= 2) return { questions: 3, freq: '매일 가볍게', minutes: '5분 안쪽', difficulty: '쉬움' };
  if (level <= 4) return { questions: 5, freq: '주 3회', minutes: '10분', difficulty: '쉬움' };
  if (level <= 6) return { questions: 6, freq: '주 4회', minutes: '12~15분', difficulty: '중간' };
  if (level <= 8) return { questions: 8, freq: '주 5회', minutes: '15~20분', difficulty: '중간' };
  return { questions: 10, freq: '원하는 만큼 매일', minutes: '20분', difficulty: '어려움' };
}
