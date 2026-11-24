import { describe, expect, it } from 'vitest';
import { levelOf, scoreOf, type Answer } from './scoring';

const all = (n: number, a: Omit<Answer, 'm'>): Answer[] => Array.from({ length: n }, () => ({ m: 'A', ...a }));

describe('levelOf', () => {
  it.each([
    [0, 1], [10, 1], [11, 2], [64, 7], [90, 9], [91, 10], [100, 10],
  ])('%i점 → %i단계', (score, level) => expect(levelOf(score)).toBe(level));
});

describe('scoreOf', () => {
  it('모두 맞히고 빠르고 힌트 없음 → 100', () => expect(scoreOf(all(16, { correct: true, seconds: 3, hint: false }))).toBe(100));
  it('모두 틀림 → 0', () => expect(scoreOf(all(16, { correct: false, seconds: 3, hint: false }))).toBe(0));
  it('모두 맞혔지만 느리고 힌트 사용 → 70', () => expect(scoreOf(all(16, { correct: true, seconds: 40, hint: true }))).toBe(70));
  it('17.5초 · 힌트 없음 → 90', () => expect(scoreOf(all(16, { correct: true, seconds: 17.5, hint: false }))).toBe(90));
  it('문항이 없으면 0', () => expect(scoreOf([])).toBe(0));
});
