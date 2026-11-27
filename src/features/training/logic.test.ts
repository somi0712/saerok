import { describe, expect, it } from 'vitest';
import { choOf, itemsFor, rng } from './bank';
import { AREAS, allocate, areaLevels, levelsUp } from './logic';

describe('문항은행', () => {
  it('영역마다 레벨 1–10에 서로 다른 문항이 50개 이상, 보기는 정답 포함 4개로 겹치지 않음', () => {
    for (const area of AREAS) {
      for (let level = 1; level <= 10; level++) {
        const items = itemsFor(area, level);
        expect(items.length, `${area} ${level}`).toBeGreaterThanOrEqual(50);
        for (const it of items) {
          const opts = [it.a, ...it.o];
          expect(new Set(opts).size, `${it.id} ${it.q}`).toBe(4);
          expect(it.h.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('같은 시드는 같은 문항', () => expect(itemsFor('B', 3)[0].q).toBe(itemsFor('B', 3)[0].q));

  it('작업기억: 숫자 길이가 레벨에 따라 늘어남', () => {
    const digits = (l: number) => Math.max(...itemsFor('C', l).filter((i) => i.memo?.includes(' - ')).map((i) => i.memo!.split('\n')[1].split(' - ').length));
    expect(digits(1)).toBe(2);
    expect(digits(10)).toBe(7);
  });

  it('첫소리 계산', () => { expect(choOf('바나나')).toBe('ㅂ'); expect(choOf('사과')).toBe('ㅅ'); });

  it('언어유창성: ‘첫소리이면서 범주’ 문항의 정답은 첫소리가 맞음', () => {
    for (const it of itemsFor('E', 9).filter((i) => i.q.includes('이면서'))) {
      expect(it.q).toContain(`‘${choOf(it.a)}’`);
    }
  });
});

describe('allocate (50/33/17, 비율 우선)', () => {
  const count = (xs: string[], m: string) => xs.filter((x) => x === m).length;
  it.each([
    [3, 1, 1, 1], [5, 2, 2, 1], [6, 3, 2, 1], [8, 4, 3, 1], [10, 5, 3, 2],
  ])('%i문항 → 제1 %i · 제2 %i · 유지 %i', (n, w1, w2, keep) => {
    const set = allocate(n, ['B', 'C'], rng(n));
    expect(set).toHaveLength(n);
    expect(count(set, 'B')).toBe(w1);
    expect(count(set, 'C')).toBe(w2);
    expect(set.filter((m) => m !== 'B' && m !== 'C')).toHaveLength(keep);
  });
  it('유지 문항이 2개 이상이면 첫·마지막에 둠', () => {
    const set = allocate(10, ['B', 'C'], rng(1));
    expect(['B', 'C']).not.toContain(set[0]);
    expect(['B', 'C']).not.toContain(set[9]);
  });
  it('유지 문항이 1개면 첫 문항', () => expect(['B', 'C']).not.toContain(allocate(6, ['B', 'C'], rng(2))[0]));
});

describe('레벨', () => {
  it('모든 칸이 15초 안 정답일 때만 다음 레벨', () => {
    expect(levelsUp(['perfect', 'perfect'])).toBe(true);
    expect(levelsUp(['perfect', 'assisted'])).toBe(false);
    expect(levelsUp(['perfect', 'skipped'])).toBe(false);
    expect(levelsUp([])).toBe(false);
  });
  it('시작 레벨: 저장값 → 테스트 영역 점수 → 1', () => {
    expect(areaLevels(undefined, undefined).A).toBe(1);
    const last = { id: 'x', at: '', score: 50, level: 5, modules: { A: { correct: 0, total: 1, ms: 0, hints: 0, score: 72 }, B: { correct: 0, total: 1, ms: 0, hints: 0, score: 0 }, C: { correct: 0, total: 1, ms: 0, hints: 0, score: 31 }, D: { correct: 1, total: 2, ms: 0, hints: 0 }, E: { correct: 0, total: 1, ms: 0, hints: 0, score: 100 } } };
    expect(areaLevels({ C: 9 }, last)).toEqual({ A: 8, B: 1, C: 9, D: 5, E: 10 });
  });
});
