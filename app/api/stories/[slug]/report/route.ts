import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST - Report a story (any authenticated user can flag)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const viewer = await getSessionUser();

    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    const { data: story } = await supabase
      .from('user_stories')
      .select('id, status')
      .eq('slug', slug)
      .maybeSingle();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    if (story.status !== 'published') {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Set moderation_status to flagged
    const { error } = await supabase
      .from('user_stories')
      .update({
        moderation_status: 'flagged',
        reported_at: new Date().toISOString(),
      })
      .eq('id', story.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: 'Story reported. An admin will review.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to report story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
