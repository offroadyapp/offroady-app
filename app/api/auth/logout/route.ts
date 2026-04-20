import { NextResponse } from 'next/server';
import { clearAuthCookies, clearSession } from '@/lib/offroady/auth';

export async function POST() {
  await clearSession();

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
