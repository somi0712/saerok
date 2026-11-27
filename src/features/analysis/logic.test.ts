import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '@/store/state';
import { nextWeekLevel, weekStats } from './logic';

const s = (at: string, correct: number, total: number, task: PracticeSession['task'] = 'training'): PracticeSession => ({ id: at, at, task, correct, total, hints: 0 });

describe('weekStats', () => {
  const now = new Date('2026-11-27T12:00:00'); // 금요일
  it('이번 주 월요일 이후 훈련만 센다', () => {
    const r = weekStats([s('2026-11-22T10:00:00', 5, 5), s('2026-11-24T10:00:00', 3, 4), s('2026-11-24T15:00:00', 1, 4), s('2026-11-25T10:00:00', 9, 9, 'check')], now);
    expect(r).toEqual({ sets: 2, days: 1, accuracy: 0.5 });
  });
  it('훈련이 없으면 0', () => expect(weekStats([], now)).toEqual({ sets: 0, days: 0, accuracy: 0 }));
});

describe('nextWeekLevel', () => {
  it('3세트 미만이면 유지', () => expect(nextWeekLevel(4, 2, 1)).toEqual({ level: 4, change: 0 }));
  it('85% 이상 +1', () => expect(nextWeekLevel(4, 3, 0.9)).toEqual({ level: 5, change: 1 }));
  it('50% 미만 −1', () => expect(nextWeekLevel(4, 5, 0.4)).toEqual({ level: 3, change: -1 }));
  it('사이면 유지', () => expect(nextWeekLevel(4, 5, 0.7)).toEqual({ level: 4, change: 0 }));
  it('1–10을 넘지 않음', () => { expect(nextWeekLevel(10, 5, 1)).toEqual({ level: 10, change: 0 }); expect(nextWeekLevel(1, 5, 0)).toEqual({ level: 1, change: 0 }); });
});
