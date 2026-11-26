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
