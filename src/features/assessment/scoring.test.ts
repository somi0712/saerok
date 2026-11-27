import { describe, expect, it } from 'vitest';
import { areaScore, courseOf, levelOf, scoreOf, speedOf, weakAreas, type Answer } from './scoring';

const all = (n: number, a: Omit<Answer, 'm'>): Answer[] =>
  Array.from({ length: n }, (_, i) => ({ m: 'ABCDE'[i % 5] as Answer['m'], ...a }));

describe('levelOf', () => {
  it.each([
    [0, 1], [10, 1], [11, 2], [64, 7], [90, 9], [91, 10], [100, 10],
  ])('%i점 → %i단계', (score, level) => expect(levelOf(score)).toBe(level));
});

describe('speedOf', () => {
  it('적정 시간보다 빨라도 1을 넘지 않음', () => expect(speedOf(0)).toBe(1));
  it('제한 시간 15초부터 0', () => { expect(speedOf(15)).toBe(0); expect(speedOf(40)).toBe(0); });
  it('5초와 15초 사이는 직선', () => expect(speedOf(10)).toBeCloseTo(0.5));
});

describe('areaScore / scoreOf (A안)', () => {
  it('0초로 기록돼도 100점을 넘지 않음', () => expect(areaScore([{ m: 'A', correct: true, seconds: 0, hint: false }])).toBe(100));
  it('모두 맞히고 빠르고 힌트 없음 → 100', () => expect(scoreOf(all(15, { correct: true, seconds: 3, hint: false }))).toBe(100));
  it('모두 틀림 → 0', () => expect(scoreOf(all(15, { correct: false, seconds: 3, hint: false }))).toBe(0));
  it('맞혔지만 제한 시간을 넘기고 힌트 사용 → 69 (60 + 0 + 9)', () => expect(scoreOf(all(15, { correct: true, seconds: 20, hint: true }))).toBe(69));
  it('문항이 없으면 0', () => expect(scoreOf([])).toBe(0));
});

describe('weakAreas', () => {
  it('가장 낮은 두 영역', () => expect(weakAreas({ A: 90, B: 40, C: 70, D: 30, E: 80 })).toEqual(['D', 'B']));
  it('동점이면 가중치가 큰 영역 먼저', () => expect(weakAreas({ A: 50, B: 50, C: 50, D: 50, E: 50 })).toEqual(['B', 'C']));
});

it('courseOf: 레벨 구간별 문항 수', () => expect([1, 3, 5, 7, 9].map((l) => courseOf(l).questions)).toEqual([3, 5, 6, 8, 10]));
