import { describe, expect, it } from 'vitest';
import { MODULE_IDS, PER_AREA, RECALL_QUESTION, pickTest, testBank } from './data';

const today = new Date('2026-11-27T10:00:00'); // 금요일, 가을

describe('기초 테스트 문항은행 (5영역 × 10문항)', () => {
  const bank = testBank(today);
  it('50문항, 영역마다 10개, 번호가 겹치지 않음', () => {
    expect(bank).toHaveLength(50);
    for (const m of MODULE_IDS) expect(bank.filter((q) => q.m === m)).toHaveLength(10);
    expect(new Set(bank.map((q) => q.id)).size).toBe(50);
  });
  it('보기는 정답 포함 4개로 겹치지 않고, 힌트가 있음', () => {
    for (const q of [...bank, RECALL_QUESTION]) {
      expect(new Set([q.a, ...q.o]).size, q.id).toBe(4);
      expect(q.h.length, q.id).toBeGreaterThan(0);
    }
  });
  it('날짜·계절 문항은 오늘 기준', () => {
    expect(bank.find((q) => q.id === 'A1')!.a).toBe('11월 27일 금요일');
    expect(bank.find((q) => q.id === 'A2')!.a).toBe('토요일');
    expect(bank.find((q) => q.id === 'A9')!.a).toBe('가을');
  });
});

describe('pickTest', () => {
  it('영역마다 3문항 + 마지막 회상 = 16문항', () => {
    const t = pickTest([], today);
    expect(t).toHaveLength(MODULE_IDS.length * PER_AREA + 1);
    for (const m of MODULE_IDS) expect(t.slice(0, -1).filter((q) => q.m === m)).toHaveLength(PER_AREA);
    expect(t.at(-1)!.id).toBe('B-recall');
  });
  it('이미 본 문항보다 새 문항을 먼저 냄', () => {
    const first = pickTest([], today).map((q) => q.id);
    const second = pickTest(first, today).map((q) => q.id).filter((id) => id !== 'B-recall');
    expect(second.some((id) => first.includes(id))).toBe(false);
  });
});
