import { describe, expect, it } from 'vitest';
import { createPersisted, isThisWeek } from './state';

describe('createPersisted', () => {
  it('저장소가 없어도 기본값으로 동작하고 갱신된다', () => {
    const s = createPersisted('test', { n: 1 });
    expect(s.get().n).toBe(1);
    s.set((p) => ({ n: p.n + 1 }));
    expect(s.get().n).toBe(2);
  });
});

describe('isThisWeek', () => {
  const wed = new Date('2026-11-25T10:00:00');
  it('같은 주 월요일과 일요일은 이번 주', () => {
    expect(isThisWeek('2026-11-23T09:00:00', wed)).toBe(true);
    expect(isThisWeek('2026-11-29T22:00:00', wed)).toBe(true);
  });
  it('지난 일요일과 다음 월요일은 아님', () => {
    expect(isThisWeek('2026-11-22T22:00:00', wed)).toBe(false);
    expect(isThisWeek('2026-11-30T09:00:00', wed)).toBe(false);
  });
});
