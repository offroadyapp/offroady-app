import { NextResponse } from 'next/server';
import { attachSessionCookie, createAccount } from '@/lib/offroady/auth';

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
    const result = await createAccount({
      displayName: body.displayName,
      email: body.email,
      phone: body.phone,
      password: body.password,
    });

    const response = NextResponse.json({ ok: true, user: result.user });
    attachSessionCookie(response, result.session);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Sign up failed') },
      { status: 400 }
    );
  }
}
