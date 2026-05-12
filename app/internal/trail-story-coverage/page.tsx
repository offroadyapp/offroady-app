import { redirect } from 'next/navigation';
import PageShell from '@/app/components/PageShell';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';
import { ADMIN_EMAILS } from '@/lib/offroady/stories';
import TrailCoverageClient from './TrailCoverageClient';

export const dynamic = 'force-dynamic';

export default async function TrailStoryCoveragePage() {
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

  // Fetch initial coverage data server-side
  const { data: initialData } = await supabase
    .from('trail_story_coverage')
    .select('*')
    .order('priority', { ascending: false })
    .order('trail_title', { ascending: true })
    .limit(200);

  type CoverageRow = {
    trail_id: string;
    trail_slug: string;
    trail_title: string;
    region: string | null;
    difficulty: string | null;
    user_story_count: number;
    blog_story_count: number;
    external_source_count: number;
    has_story: boolean;
    priority: string;
    is_featured: boolean;
    featured_candidate: boolean;
  };

  const items = (initialData ?? []) as CoverageRow[];
  const summary = {
    total: items.length,
    withStories: items.filter((t: CoverageRow) => t.has_story).length,
    withoutStories: items.filter((t: CoverageRow) => !t.has_story).length,
    highPriority: items.filter((t: CoverageRow) => t.priority === 'high').length,
    mediumPriority: items.filter((t: CoverageRow) => t.priority === 'medium').length,
  };

  return (
    <PageShell>
      <TrailCoverageClient initialData={items} initialSummary={summary} />
    </PageShell>
  );
}
