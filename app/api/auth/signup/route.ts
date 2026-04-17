import { NextResponse } from 'next/server';
import { attachSessionCookie, createAccount } from '@/lib/offroady/auth';

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
    attachSessionCookie(response, result.session.token, result.session.expiresAt);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign up failed' },
      { status: 400 }
    );
  }
}
