import { describe, expect, it } from 'vitest';
import { attendanceDate, attendanceStreak, monthCells } from './logic';

describe('attendance calendar', () => {
  it('lays out leap February with Monday as the first column', () => {
    const days = monthCells(new Date(2024, 1, 19));
    expect(days.slice(0, 3)).toEqual([null, null, null]);
    expect(days.filter(Boolean)).toHaveLength(29);
    expect(days[31]?.getDate()).toBe(29);
  });

  it('counts a streak across consecutive months and stops at a missing day', () => {
    const dates = new Set(['2026-10-31', '2026-11-01', '2026-11-02', '2026-10-29']);
    expect(attendanceStreak(dates, new Date(2026, 10, 3))).toBe(3);
    expect(attendanceStreak(dates, new Date(2026, 10, 4))).toBe(0);
    expect(attendanceDate(new Date(2026, 10, 3, 23))).toBe('2026-11-03');
  });
});
