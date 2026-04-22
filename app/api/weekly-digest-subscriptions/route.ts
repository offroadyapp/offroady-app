import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { subscribeToWeeklyDigest } from '@/lib/offroady/email-preferences';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    const body = await request.json();
    const requestedEmail = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
    const email = viewer?.email ?? requestedEmail;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await subscribeToWeeklyDigest(email, viewer?.id ?? null);
    return NextResponse.json({
      ok: true,
      email,
      alreadySubscribed: result.alreadySubscribed,
      preferences: result.preferences,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to subscribe to the weekly digest' },
      { status: 400 }
    );
  }
}
