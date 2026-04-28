import { NextResponse } from 'next/server';
import { attachSessionCookie, completeOAuthSession } from '@/lib/offroady/auth';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await completeOAuthSession({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    });

    const response = NextResponse.json({ ok: true, user: result.user });
    attachSessionCookie(response, result.session);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Social sign-in failed') },
      { status: 400 }
    );
  }
}
