import { describe, expect, it } from 'vitest';
import { EXAMPLE_WEEKS, fourWeekLabels, todayIndex, weekRangeLabel, weekStart } from './tour';

const wed = new Date('2026-11-25T10:00:00'); // 수요일

describe('예제 기록 날짜', () => {
  it('주는 월요일에 시작한다', () => {
    expect(weekStart(wed).getDate()).toBe(23);
    expect(weekStart(new Date('2026-11-29T23:00:00')).getDate()).toBe(23); // 일요일
  });
  it('이번 주 범위와 4주 막대 이름', () => {
    expect(weekRangeLabel(wed)).toBe('11월 23일 – 11월 29일');
    expect(fourWeekLabels(wed)).toEqual(['11/2주', '11/9주', '11/16주', '이번 주']);
  });
  it('요일 번호는 월요일이 0', () => {
    expect(todayIndex(wed)).toBe(2);
  });
  it('예제 4주 합계는 12회 (28번 화면 문구와 같음)', () => {
    expect(EXAMPLE_WEEKS.reduce((a, b) => a + b, 0)).toBe(12);
  });
});
