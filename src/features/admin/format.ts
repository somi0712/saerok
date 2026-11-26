// 관리자 화면이 함께 쓰는 표시 규칙. 화면 없이 테스트할 수 있게 순수 함수로 둔다.
import type { Announcement } from '@/data/announcements';
import type { AdminUser } from '@/data/admins';

const dateFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
export const formatDate = (iso: string | null) => (iso ? dateFmt.format(new Date(iso)) : '-');
export const formatDateTime = (iso: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '-');

export type NoticeStatus = 'draft' | 'scheduled' | 'live';
export const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = { draft: '초안', scheduled: '예약', live: '게시 중' };

export function noticeStatus(notice: Pick<Announcement, 'published' | 'publish_at'>, now = Date.now()): NoticeStatus {
  if (!notice.published) return 'draft';
  return notice.publish_at && Date.parse(notice.publish_at) > now ? 'scheduled' : 'live';
}

/** ISO 시각 → `<input type="datetime-local">` 값 (사용자 기기의 시간대) */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `<input type="datetime-local">` 값 → ISO. 비어 있으면 null(즉시 게시) */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

export type UserStatus = 'pending' | 'active' | 'suspended';
export const USER_STATUS_LABEL: Record<UserStatus, string> = { pending: '확인 대기', active: '이용 중', suspended: '정지' };

export function userStatus(user: Pick<AdminUser, 'confirmed' | 'suspended'>): UserStatus {
  if (user.suspended) return 'suspended';
  return user.confirmed ? 'active' : 'pending';
}

const ACTION_LABEL: Record<string, string> = {
  'announcement.create': '공지 작성',
  'announcement.update': '공지 수정',
  'admin.add': '관리자 추가',
  'admin.remove': '관리자 해제',
  'user.confirm': '계정 확인 처리',
  'user.activate': '이용 정지 해제',
  'user.suspend': '이용 정지',
};
export const actionLabel = (action: string) => ACTION_LABEL[action] ?? action;

const ERRORS: Record<string, string> = {
  not_admin: '관리자 권한이 없어요. 다시 로그인해 주세요.',
  user_not_found: '해당 계정을 찾지 못했어요.',
  cannot_change_self: '내 계정은 바꿀 수 없어요. 다른 관리자에게 부탁해 주세요.',
  cannot_remove_self: '내 계정은 해제할 수 없어요. 다른 관리자에게 부탁해 주세요.',
  reason_required: '사유를 두 글자 이상 적어 주세요.',
};
/** Supabase 오류의 message(= DB에서 raise 한 코드)를 안내 문구로 바꾼다 */
export const errorText = (error: unknown, fallback: string, extra: Record<string, string> = {}) => {
  const code = (error as { message?: string } | null)?.message ?? '';
  return extra[code] ?? ERRORS[code] ?? fallback;
};
