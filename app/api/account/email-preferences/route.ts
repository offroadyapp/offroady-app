import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import { getEmailPreferencesByEmail, getEmailPreferencesByToken, updateEmailPreferencesByEmail, updateEmailPreferencesByToken } from '@/lib/offroady/email-preferences';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (token) {
      const preferences = await getEmailPreferencesByToken(token);
      return NextResponse.json({ ok: true, preferences, token });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getEmailPreferencesByEmail(user.email, user.id);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load email preferences' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : '';
    const patch = {
      weeklyTrailUpdates: body.weeklyTrailUpdates,
      tripNotifications: body.tripNotifications,
      crewNotifications: body.crewNotifications,
      commentReplyNotifications: body.commentReplyNotifications,
      marketingPromotionalEmails: body.marketingPromotionalEmails,
    };

    if (token) {
      const preferences = await updateEmailPreferencesByToken(token, patch);
      return NextResponse.json({ ok: true, preferences, token });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await updateEmailPreferencesByEmail(user.email, patch, user.id);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update email preferences' },
      { status: 400 }
    );
  }
}
