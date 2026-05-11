import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import StoryAdminReviewClient from './StoryAdminReviewClient';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['offroady.admin@gmail.com', 'admin@offroady.app'];

export default async function StoryReviewPage() {
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
      <StoryAdminReviewClient />
    </PageShell>
  );
}
