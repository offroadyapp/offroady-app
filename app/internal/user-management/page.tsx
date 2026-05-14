import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import UserManagementClient from './UserManagementClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { isAdminEmail } from '@/lib/offroady/stories';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function UserManagementPage() {
  const viewer = await getSessionUser();

  if (!viewer) {
    redirect('/?login=internal');
  }

  // Check admin status
  const supabase = getServiceSupabase();
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', viewer.id)
    .single();

  if (!user || !isAdminEmail(user.email)) {
    redirect('/');
  }

  return (
    <PageShell>
      <UserManagementClient viewerId={viewer.id} />
    </PageShell>
  );
}
