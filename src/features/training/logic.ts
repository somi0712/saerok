import type { Assessment, ModuleId } from '@/store/state';
import { createPersisted } from '@/store/state';
import { levelOf } from '@/features/assessment/scoring';
import { areasOf, weakOf } from '@/features/assessment/LevelScreens';
import { itemsFor, shuffle, type Item } from './bank';

export const AREAS: ModuleId[] = ['A', 'B', 'C', 'D', 'E'];
export const TIME_LIMIT = 15; // 초. 안내(기억하기)가 끝나고 답할 수 있게 된 때부터 잰다.

/**
 * 맞춤 훈련 영역 배치 (A안, 하나로 통일한 규칙)
 * - 비율: 제1 취약 50% · 제2 취약 33% · 유지(나머지 세 영역) 17%, 최대 나머지 방식으로 반올림
 * - 비율이 배치보다 먼저다. 유지 문항이 2개 이상이면 첫·마지막에, 1개면 첫 문항에 둔다.
 */
export function allocate(n: number, weak: ModuleId[], r: () => number = Math.random): ModuleId[] {
  const shares = [0.5, 0.33, 0.17].map((p) => p * n);
  const counts = shares.map(Math.floor);
  const order = shares.map((s, i) => [s - counts[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; counts.reduce((a, b) => a + b, 0) < n; k++) counts[order[k % 3][1]]++;
  const keep = shuffle(AREAS.filter((m) => !weak.includes(m)), r);
  const maint = Array.from({ length: counts[2] }, (_, i) => keep[i % keep.length]);
  const middle = shuffle([...Array(counts[0]).fill(weak[0]), ...Array(counts[1]).fill(weak[1])], r) as ModuleId[];
  if (maint.length >= 2) return [maint[0], ...middle, ...maint.slice(2), maint[1]];
  return [...maint, ...middle];
}

/** 시작 레벨: 저장된 영역 레벨 → 테스트의 영역 점수로 제안 → 1단계 */
export function areaLevels(saved: Partial<Record<ModuleId, number>> | undefined, last: Assessment | undefined): Record<ModuleId, number> {
  const scores = last ? areasOf(last) : undefined;
  return Object.fromEntries(AREAS.map((m) => [m, saved?.[m] ?? (scores ? levelOf(scores[m]) : 1)])) as Record<ModuleId, number>;
}

export const weakFor = (last: Assessment | undefined): ModuleId[] => (last ? weakOf(last) : ['B', 'C']);

// 이미 푼 문항 — 같은 레벨에서도 아직 풀지 않은 문항부터 낸다 (기기별 기록)
const solved = createPersisted<{ ids: string[] }>('saerok-training-seen', { ids: [] });

/** 영역·레벨에서 아직 풀지 않은 문항 하나. 다 풀었으면 지금 세트에 없는 문항 중에서 고른다. */
export function draw(area: ModuleId, level: number, avoid: Set<string>, r: () => number = Math.random): Item {
  const bank = itemsFor(area, level).filter((it) => !avoid.has(it.id));
  const seen = new Set(solved.get().ids);
  const fresh = bank.filter((it) => !seen.has(it.id));
  const pool = fresh.length ? fresh : bank;
  return pool[Math.floor(r() * pool.length)];
}

export function markSolved(ids: string[]) {
  solved.set((s) => ({ ids: [...new Set([...s.ids, ...ids])].slice(-2000) }));
}

/** 한 문항의 결과: 15초 안에 정답 / 힌트·시간 초과 뒤 정답 / 건너뜀 */
export type Outcome = 'perfect' | 'assisted' | 'skipped';

/** 세트를 마치면 칸마다 마지막 결과가 남는다. 모든 칸이 15초 안 정답이면 다음 레벨로. */
export const levelsUp = (slots: Outcome[]) => slots.length > 0 && slots.every((o) => o === 'perfect');
