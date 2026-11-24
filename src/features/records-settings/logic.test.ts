import { describe, expect, it } from 'vitest';
import type { PracticeSession } from '@/store/state';
import { daysSinceLast, last7Days, needsFamilyAlert, strategyCounts, weekDaysDone, weeklyCounts } from './logic';

const s = (at: string, strategy?: string): PracticeSession => ({ id: at, at, task: 'order', correct: 3, total: 3, hints: 0, strategy });
const now = new Date('2026-11-25T12:00:00'); // 수요일

describe('weeklyCounts', () => {
  it('4주를 오래된 순으로 세고 마지막은 이번 주', () => {
    const w = weeklyCounts([s('2026-11-02T10:00:00'), s('2026-11-16T10:00:00'), s('2026-11-23T09:00:00'), s('2026-11-25T08:00:00')], now);
    expect(w.map((x) => x.count)).toEqual([1, 0, 1, 2]);
    expect(w[3].label).toBe('이번 주');
    expect(w[0].label).toBe('11/2주');
  });
  it('4주보다 오래된 기록은 세지 않음', () => {
    expect(weeklyCounts([s('2026-10-26T10:00:00')], now).every((x) => x.count === 0)).toBe(true);
  });
});

describe('weekDaysDone', () => {
  it('이번 주 월·수만 표시', () => {
    expect(weekDaysDone([s('2026-11-23T09:00:00'), s('2026-11-25T09:00:00'), s('2026-11-20T09:00:00')], now)).toEqual([
      true, false, true, false, false, false, false,
    ]);
  });
});

describe('가족 알림 기준', () => {
  it('마지막 연습 후 지난 날 수', () => {
    expect(daysSinceLast([], now)).toBeNull();
    expect(daysSinceLast([s('2026-11-25T01:00:00')], now)).toBe(0);
    expect(daysSinceLast([s('2026-11-22T23:00:00')], now)).toBe(3);
  });
  it('3일부터 알림', () => {
    expect(needsFamilyAlert(null)).toBe(false);
    expect(needsFamilyAlert(2)).toBe(false);
    expect(needsFamilyAlert(3)).toBe(true);
  });
  it('최근 7일은 오늘로 끝남', () => {
    const d = last7Days([s('2026-11-25T08:00:00'), s('2026-11-25T18:00:00')], now);
    expect(d).toHaveLength(7);
    expect(d[6].count).toBe(2);
    expect(d[0].count).toBe(0);
  });
});

describe('strategyCounts', () => {
  it('많이 쓴 순서', () => {
    expect(strategyCounts([s('2026-11-25T01:00:00', '묶기'), s('2026-11-24T01:00:00', '장면'), s('2026-11-23T01:00:00', '묶기')])).toEqual([
      ['묶기', 2],
      ['장면', 1],
    ]);
  });
});
