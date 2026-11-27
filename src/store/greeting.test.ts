import { expect, it, vi } from 'vitest';
import { greeting } from './account';
import { readGuestPreferences } from './state';

it('비로그인은 이름을 부르지 않음', () => {
  expect(greeting({ userId: null, name: null })).toBe('반가워요.');
  expect(greeting({ userId: null, name: '정희' })).toBe('반가워요.');
});

it('로그인하면 가입 때 적은 이름으로, 이름이 없으면 이름 없이', () => {
  expect(greeting({ userId: 'u1', name: '소미' })).toBe('소미님, 반가워요.');
  expect(greeting({ userId: 'u1', name: null })).toBe('반가워요.');
});

it('로그인할 때 이 브라우저에서 적은 이름은 계정으로 옮기지 않음', () => {
  const saved = JSON.stringify({ profile: { name: '정희', ageBand: '20대', gender: '', methodFamiliarity: '' } });
  vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'saerok-guest-v2' ? saved : null) });
  const p = readGuestPreferences().profile;
  vi.unstubAllGlobals();
  expect(p.name).toBe('');
  expect(p.ageBand).toBe('20대');
});
