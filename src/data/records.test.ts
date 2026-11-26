import { describe, expect, it } from 'vitest';
import type { Assessment, PracticeSession } from '@/store/state';
import { fromAssessmentRow, fromSessionRow, mergeById, toAssessmentRow, toSessionRow } from './records';

const session: PracticeSession = { id: 's1', at: '2026-11-27T01:00:00.000Z', task: 'order', correct: 4, total: 5, hints: 1, strategy: '묶기', burden: 'ok', minutes: 7 };

describe('기록 ↔ 서버 행', () => {
  it('연습 기록을 그대로 오가게 한다', () => {
    const row = toSessionRow('u1', session)!;
    expect(row).toMatchObject({ user_id: 'u1', id: 's1', task: 'order', strategy: '묶기', minutes: 7 });
    expect(fromSessionRow(row)).toEqual(session);
  });

  it('검사 조건을 넘는 값은 고치거나 뺀다', () => {
    const row = toSessionRow('u1', { ...session, correct: -2, hints: 1.6, minutes: 900, strategy: 'x'.repeat(60), burden: 'bad' as never })!;
    expect(row).toMatchObject({ correct: 0, hints: 2, minutes: 600, burden: null });
    expect(row.strategy).toHaveLength(40);
    expect(toSessionRow('u1', { ...session, at: 'not a date' })).toBeNull();
    expect(toSessionRow('u1', { ...session, id: '' })).toBeNull();
    expect(toSessionRow('u1', { ...session, task: 'diary' as never })).toBeNull();
  });

  it('테스트 결과는 점수 0–100, 단계 1–10 안으로', () => {
    const a: Assessment = { id: 'a1', at: '2026-11-27T01:00:00.000Z', score: 120, level: 0, modules: {} as Assessment['modules'] };
    const row = toAssessmentRow('u1', a)!;
    expect(row).toMatchObject({ score: 100, level: 1 });
    expect(fromAssessmentRow(row)).toEqual({ ...a, score: 100, level: 1 });
  });
});

describe('mergeById', () => {
  const x = (id: string, at: string) => ({ id, at });
  it('서버에만 있는 기록을 날짜 순으로 더하고, 같은 id 는 이 기기 것을 둔다', () => {
    const local = [x('b', '2026-11-02'), x('c', '2026-11-03')];
    const merged = mergeById(local, [x('a', '2026-11-01'), { ...x('b', '2026-11-02'), extra: 1 }]);
    expect(merged.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(merged[1]).toBe(local[0]);
  });
  it('더할 게 없으면 같은 배열을 돌려준다', () => {
    const local = [x('a', '2026-11-01')];
    expect(mergeById(local, [x('a', '2026-11-01')])).toBe(local);
  });
});
