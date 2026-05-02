import { NextResponse } from 'next/server';
import { getServerAuthSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getServerAuthSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://www.offroady.app/reset-password/confirm`,
    });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: 'If that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send reset email' },
      { status: 400 }
    );
  }
}
