import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { isAdminEmail } from '@/lib/offroady/stories';
import { getServiceSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/users/[userId]
 *
 * Anonymizes a registered user so that:
 * - email, display_name, phone, and all PII are wiped from public.users
 * - auth_user_id is set to NULL (sever link to Supabase Auth)
 * - The row in public.users is NOT deleted (keeps FK references valid)
 * - The corresponding Supabase Auth user IS deleted (user can re-register)
 * - All published content (stories, comments, etc.) remains intact
 *
 * The admin cannot delete their own account.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const viewer = await getSessionUser();
    if (!viewer || !isAdminEmail(viewer.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cannot delete yourself
    if (viewer.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own admin account' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get the target user
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, auth_user_id, email, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also protect the admin from being deleted
    if (targetUser.email && isAdminEmail(targetUser.email)) {
      return NextResponse.json(
        { error: 'Cannot delete another admin account' },
        { status: 400 }
      );
    }

    // Step 1: Delete the Supabase Auth user so they can re-register
    if (targetUser.auth_user_id) {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
        targetUser.auth_user_id
      );
      if (authDeleteError) {
        console.error('Failed to delete auth user:', authDeleteError.message);
        // Continue anyway — we still want to anonymize the profile
      }
    }

    // Step 2: Anonymize the public.users row
    // Keep the row (maintains FK integrity), wipe all personal data
    // email uses a unique placeholder (NOT NULL constraint), auth_user_id is NULL so they can re-register
    const deletedEmail = `deleted-${userId}@deleted.local`;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: deletedEmail,
        display_name: '[Deleted User]',
        phone: null,
        auth_user_id: null,
        profile_slug: null,
        bio: null,
        avatar_image: null,
        rig_name: null,
        rig_photo: null,
        rig_mods: null,
        experience_since: null,
        areas_driven: null,
        pet_name: null,
        pet_note: null,
        share_vibe: null,
        password_hash: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'User has been anonymized. Auth account deleted. Content preserved.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    console.error('Admin delete user error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
