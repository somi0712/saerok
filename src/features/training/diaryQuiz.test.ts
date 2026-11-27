import { describe, expect, it } from 'vitest';
import { rng } from './bank';
import { asQuestion, diaryQuestions, parseSentence } from './diaryQuiz';

const entry = (text: string, mood = '😊 기뻐요') => ({ id: 'd', at: '2026-11-27T10:00:00Z', mood, text });

describe('일기 문장 읽기', () => {
  it('장소·대상·동사', () => expect(parseSentence('시장에 가서 두부를 샀어요.')).toEqual({ place: '시장', obj: '두부', verb: '샀어요.' }));
  it('시간 낱말은 장소가 아님', () => expect(parseSentence('오후에 공원에서 친구를 만났다').place).toBe('공원'));
  it.each([['샀어요.', '샀나요'], ['먹었다', '먹었나요'], ['마셨어요', '마셨나요']])('%s → %s', (v, q) => expect(asQuestion(v)).toBe(q));
});

describe('diaryQuestions', () => {
  it('노션 예시: “시장에 가서 두부를 샀어요.” → “시장에서 무엇을 샀나요?” → 두부', () => {
    const qs = diaryQuestions(entry('시장에 가서 두부를 샀어요.'), [], rng(1));
    expect(qs[0]).toMatchObject({ q: '시장에서 무엇을 샀나요?', a: '두부' });
    expect(qs[1]).toMatchObject({ q: '어디에서 두부를 샀나요?', a: '시장' });
    for (const q of qs) expect(new Set([q.a, ...q.o]).size).toBe(4);
  });
  it('만났으면 ‘누구를’', () => expect(diaryQuestions(entry('복지관에서 영희를 만났어요.'), [], rng(2))[0].q).toBe('복지관에서 누구를 만났나요?'));
  it('읽을 문장이 없어도 기분 문제는 남음', () => expect(diaryQuestions(entry('좋은 하루'), [], rng(3)).map((q) => q.a)).toEqual(['😊 기뻐요']));
});
