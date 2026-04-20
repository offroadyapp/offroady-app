import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const baseUrl = new URL(request.url).origin;
    const supabase = getServiceSupabase();
    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${baseUrl}/reset-password/confirm`,
      },
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
