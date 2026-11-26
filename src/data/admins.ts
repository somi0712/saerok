import type { database } from './announcements';

type Client = NonNullable<typeof database>;

export interface AdminMember {
  user_id: string;
  email: string;
}

export async function listAdmins(client: Client): Promise<AdminMember[]> {
  const { data, error } = await client.rpc('list_admins');
  if (error) throw error;
  return data ?? [];
}

export async function addAdmin(client: Client, email: string) {
  const { error } = await client.rpc('add_admin', { target_email: email.trim() });
  if (error) throw error;
}

export async function removeAdmin(client: Client, userId: string) {
  const { error } = await client.rpc('remove_admin', { target: userId });
  if (error) throw error;
}

export interface Overview {
  users: number;
  confirmed_users: number;
  record_users: number;
  admins: number;
  sessions_total: number;
  sessions_7d: number;
  assessments_total: number;
  notices_live: number;
  notices_scheduled: number;
  notices_draft: number;
  /** 최근 테스트 단계 → 사람 수 */
  levels: Record<string, number>;
  /** 최근 14일 날짜별 연습 수 */
  daily: { day: string; n: number }[];
}

export interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  suspended: boolean;
  is_admin: boolean;
  sessions: number;
  last_practice_at: string | null;
  last_level: number | null;
}

export interface AuditEntry {
  id: number;
  at: string;
  actor_email: string | null;
  action: string;
  target: string | null;
  detail: Record<string, unknown>;
}

async function call<T>(client: Client, fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const adminOverview = (client: Client) => call<Overview>(client, 'admin_overview');
export const adminUsers = async (client: Client) => (await call<AdminUser[] | null>(client, 'admin_users')) ?? [];
export const confirmUser = (client: Client, userId: string) => call<void>(client, 'admin_confirm_user', { target: userId });
export const setUserStatus = (client: Client, userId: string, active: boolean, reason: string) =>
  call<void>(client, 'admin_set_user_status', { target: userId, active, reason: reason.trim() });
export const auditLog = async (client: Client, maxRows = 100) =>
  (await call<AuditEntry[] | null>(client, 'admin_audit_log', { max_rows: maxRows })) ?? [];
