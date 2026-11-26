import { describe, expect, it } from 'vitest';
import { actionLabel, errorText, fromLocalInput, noticeStatus, toLocalInput, userStatus } from './format';

describe('관리자 표시 규칙', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');

  it('공지 상태: 초안 · 예약 · 게시 중', () => {
    expect(noticeStatus({ published: false, publish_at: null }, now)).toBe('draft');
    expect(noticeStatus({ published: false, publish_at: '2026-12-01T00:00:00Z' }, now)).toBe('draft');
    expect(noticeStatus({ published: true, publish_at: '2026-12-01T00:00:00Z' }, now)).toBe('scheduled');
    expect(noticeStatus({ published: true, publish_at: '2026-11-01T00:00:00Z' }, now)).toBe('live');
    expect(noticeStatus({ published: true, publish_at: null }, now)).toBe('live');
  });

  it('예약 시각 입력값은 ISO와 왕복한다', () => {
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('nope')).toBeNull();
    expect(toLocalInput(null)).toBe('');
    const iso = fromLocalInput('2026-12-01T09:30');
    expect(iso).not.toBeNull();
    expect(toLocalInput(iso)).toBe('2026-12-01T09:30');
  });

  it('사용자 상태는 정지가 가장 우선', () => {
    expect(userStatus({ confirmed: false, suspended: false })).toBe('pending');
    expect(userStatus({ confirmed: true, suspended: false })).toBe('active');
    expect(userStatus({ confirmed: true, suspended: true })).toBe('suspended');
  });

  it('작업 이름과 오류 코드를 한국어로', () => {
    expect(actionLabel('admin.add')).toBe('관리자 추가');
    expect(actionLabel('unknown.thing')).toBe('unknown.thing');
    expect(errorText({ message: 'reason_required' }, '실패')).toContain('사유');
    expect(errorText(new Error('boom'), '실패')).toBe('실패');
    expect(errorText({ message: 'user_not_found' }, '실패', { user_not_found: '가입 안 함' })).toBe('가입 안 함');
  });
});
