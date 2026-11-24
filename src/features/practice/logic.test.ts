import { describe, expect, it } from 'vitest';
import { makeOptions, makeTarget, practicedWeekdays, recommend, scoreOrder, strategyOfToday } from './logic';
import type { PracticeSession } from '@/store/state';

describe('scoreOrder', () => {
  const target = ['apple', 'milk', 'bread'];
  it('모두 제자리', () => expect(scoreOrder(target, target)).toEqual({ correct: 3, total: 3, orderErrors: 0, intrusions: 0 }));
  it('자리 바뀜과 없던 물건을 구분', () =>
    expect(scoreOrder(target, ['milk', 'apple', 'fish'])).toEqual({ correct: 0, total: 3, orderErrors: 2, intrusions: 1 }));
  it('덜 고른 경우', () => expect(scoreOrder(target, ['apple'])).toMatchObject({ correct: 1, total: 3 }));
});

describe('makeTarget / makeOptions', () => {
  it('서로 다른 물건, 보기에 정답 포함', () => {
    const t = makeTarget(4);
    expect(new Set(t).size).toBe(4);
    const o = makeOptions(t);
    expect(o).toHaveLength(6);
    t.forEach((id) => expect(o).toContain(id));
  });
});

describe('recommend (R01)', () => {
  const good = { order: { correct: 4, total: 4, hints: 0 }, recall: { correct: 4, total: 4, cue: 'none' as const }, length: 4 };
  it('기록이 없으면 보류', () => expect(recommend({ ...good, order: { correct: 0, total: 0, hints: 0 } }).hold).toBe(true));
  it('힘들었으면 하나 줄임 (최소 3)', () => {
    expect(recommend({ ...good, burden: 'hard' }).nextLength).toBe(3);
    expect(recommend({ ...good, burden: 'hard', length: 3 }).nextLength).toBe(3);
  });
  it('다시 보기 2번 이상이면 묶기', () => expect(recommend({ ...good, order: { correct: 4, total: 4, hints: 2 } }).strategy).toBe('group'));
  it('회상 절반 미만이면 그림 떠올리기', () =>
    expect(recommend({ ...good, recall: { correct: 1, total: 4, cue: 'hint' } }).ruleId).toBe('R-EM-1'));
  it('둘 다 안정적이면 하나 늘림 (최대 5)', () => {
    expect(recommend(good).nextLength).toBe(5);
    expect(recommend({ ...good, length: 5 }).ruleId).toBe('R-KEEP');
  });
  it('힌트로 떠올렸으면 늘리지 않음', () => expect(recommend({ ...good, recall: { correct: 4, total: 4, cue: 'hint' } }).ruleId).toBe('R-KEEP'));
});

describe('strategyOfToday', () => {
  it('유형 결과의 전략을 먼저', () => expect(strategyOfToday('묶기 · 순서')).toBe('group'));
  it('없으면 날짜마다 돌아감', () => expect(['group', 'picture', 'meaning']).toContain(strategyOfToday(undefined)));
});

describe('practicedWeekdays', () => {
  const s = (at: string): PracticeSession => ({ id: at, at, task: 'order', correct: 1, total: 1, hints: 0 });
  it('이번 주 연습한 요일만, 같은 날은 한 번', () => {
    const now = new Date('2026-11-27T12:00:00'); // 금
    const days = practicedWeekdays([s('2026-11-23T10:00:00'), s('2026-11-23T15:00:00'), s('2026-11-25T09:00:00'), s('2026-11-20T09:00:00')], now);
    expect([...days]).toEqual(['월', '수']);
  });
});
