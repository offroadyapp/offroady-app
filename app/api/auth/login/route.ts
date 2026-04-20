import { NextResponse } from 'next/server';
import { attachSessionCookie, loginAccount } from '@/lib/offroady/auth';

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
    const result = await loginAccount(body.email, body.password);

    const response = NextResponse.json({ ok: true, user: result.user });
    attachSessionCookie(response, result.session);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Log in failed') },
      { status: 400 }
    );
  }
}
