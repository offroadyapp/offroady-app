import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { isAdminEmail } from '@/lib/offroady/stories';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const viewer = await getSessionUser();
    if (!viewer || !isAdminEmail(viewer.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = getServiceSupabase();

    // Fetch all users ordered by creation date
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, display_name, auth_user_id, profile_slug, phone, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: users || [], total: (users || []).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
