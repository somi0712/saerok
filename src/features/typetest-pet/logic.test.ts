import { describe, expect, it } from 'vitest';
import { feedPet, typeResultOf } from './logic';

describe('feedPet', () => {
  const base = { kind: 'mongle' as const, seeds: 2, snacks: 0, grown: false };
  it('씨앗 2개로 간식 1개', () => {
    expect(feedPet(base)).toMatchObject({ seeds: 0, snacks: 1, grown: false });
  });
  it('씨앗이 모자라면 그대로', () => {
    expect(feedPet({ ...base, seeds: 1 })).toEqual({ ...base, seeds: 1 });
  });
  it('간식 3개째에 자란다', () => {
    expect(feedPet({ ...base, seeds: 5, snacks: 2 })).toMatchObject({ seeds: 3, snacks: 3, grown: true });
  });
});

describe('typeResultOf', () => {
  it('예시 답변은 VGST 장면을 묶는 탐험가', () => {
    const r = typeResultOf(['V', 'G', 'S', 'T']);
    expect(r.code).toBe('VGST');
    expect(r.title).toBe('장면을 묶는 탐험가');
    expect(r.strategy).toBe('그림으로 묶기');
  });
  it('빈 답은 예시 답으로 채운다', () => {
    expect(typeResultOf(['W', 'S']).code).toBe('WSST');
  });
});
