import { createClient } from '@supabase/supabase-js';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  published: boolean;
  /** 예약 게시 시각. 비어 있으면 게시 즉시 보인다. */
  publish_at: string | null;
  created_at: string;
}

type NoticeInput = Pick<Announcement, 'title' | 'body' | 'published' | 'publish_at'>;
const COLUMNS = 'id,title,body,published,publish_at,created_at';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const database = url && publishableKey?.startsWith('sb_publishable_')
  ? createClient(url, publishableKey)
  : null;

export async function listAnnouncements(
  client: NonNullable<typeof database>,
  publishedOnly: boolean,
): Promise<Announcement[]> {
  const query = client.from('announcements')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  // 관리자로 로그인해 있어도 사용자 목록에는 예약 시각이 지난 공지만 보인다.
  const { data, error } = publishedOnly
    ? await query.eq('published', true).or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`).limit(3)
    : await query;
  if (error) throw error;
  return data;
}

export async function saveAnnouncement(
  client: NonNullable<typeof database>, notice: NoticeInput, id?: string,
): Promise<Announcement> {
  const input = { ...notice, title: notice.title.trim(), body: notice.body.trim() };
  const table = client.from('announcements');
  const query = id ? table.update(input).eq('id', id) : table.insert(input);
  const { data, error } = await query.select(COLUMNS).single();
  if (error) throw error;
  return data;
}
