import { NextResponse } from 'next/server';
import { unsubscribeCategoryByToken, type EmailPreferenceCategory } from '@/lib/offroady/email-preferences';

const allowed = new Set<EmailPreferenceCategory>([
  'weeklyTrailUpdates',
  'tripNotifications',
  'crewNotifications',
  'commentReplyNotifications',
  'marketingPromotionalEmails',
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : '';
    const category = typeof body.category === 'string' ? body.category : '';

    if (!allowed.has(category)) {
      return NextResponse.json({ error: 'Invalid unsubscribe category' }, { status: 400 });
    }

    const preferences = await unsubscribeCategoryByToken(token, category as EmailPreferenceCategory);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unsubscribe' },
      { status: 400 }
    );
  }
}
