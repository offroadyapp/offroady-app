import { NextResponse } from 'next/server';
import { clearSession, getSessionCookieName } from '@/lib/offroady/auth';

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieName = getSessionCookieName();
  const token = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split('=')[1];

  await clearSession(token);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
  return response;
}
