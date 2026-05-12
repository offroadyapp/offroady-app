import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/offroady/stories';
import ContentSourcesClient from './ContentSourcesClient';

export const dynamic = 'force-dynamic';

export default async function ContentSourcesPage() {
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

  if (!user || !ADMIN_EMAILS.includes(user.email.trim().toLowerCase())) {
    redirect('/');
  }

  return (
    <PageShell>
      <ContentSourcesClient />
    </PageShell>
  );
}
