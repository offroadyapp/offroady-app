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
    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    const isRateLimited = message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('too many');
    return NextResponse.json(
      {
        error: isRateLimited
          ? '邮件请求过于频繁，请约一小时后重试。'
          : message,
        rateLimited: isRateLimited,
      },
      { status: isRateLimited ? 429 : 400 }
    );
  }
}
