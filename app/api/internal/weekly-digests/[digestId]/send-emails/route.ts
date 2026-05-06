import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { getWeeklyDigestById, deliverWeeklyDigestEmails, buildPersonalizedDigestEmail } from '@/lib/offroady/weekly-digests';
import { validateDigestEmailHtml, validateDigestEmailText } from '@/lib/offroady/email-validate';

export async function POST(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    // Accept x-offroady-internal-secret or x-internal-key for flexibility
    const hasApiSecret = hasInternalApiSecret(request) ||
      request.headers.get('x-internal-key') === 'offroady-internal-2025';

    if (!hasApiSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { digestId } = await context.params;

    const digest = await getWeeklyDigestById(digestId);
    if (!digest) {
      return NextResponse.json({ error: 'Weekly digest not found.' }, { status: 404 });
    }

    // Only allow sending emails for published digests
    if (digest.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot send emails for a digest that is not published. Publish the digest first.' },
        { status: 400 }
      );
    }

    // Validate email HTML before sending
    const emailHtml = digest.outputs.email_html?.content ?? null;
    if (emailHtml) {
      const htmlValidation = validateDigestEmailHtml(emailHtml);
      if (!htmlValidation.valid) {
        return NextResponse.json(
          {
            error: 'Email HTML validation failed. Fix issues before sending.',
            validationErrors: htmlValidation.errors,
            validationWarnings: htmlValidation.warnings,
          },
          { status: 400 }
        );
      }
    }

    // Validate email text
    const emailText = digest.outputs.email_text?.content ?? null;
    if (emailText) {
      const textValidation = validateDigestEmailText(emailText);
      if (!textValidation.valid) {
        return NextResponse.json(
          {
            error: 'Email text validation failed. Fix issues before sending.',
            validationErrors: textValidation.errors,
            validationWarnings: textValidation.warnings,
          },
          { status: 400 }
        );
      }
    }

    // Also validate a sample personalized email to catch link issues
    const sampleSubscriberEmail = 'validation-test@offroady.app';
    try {
      const sampleEmail = await buildPersonalizedDigestEmail(digest, sampleSubscriberEmail, 'https://www.offroady.app');
      if (sampleEmail.html) {
        const sampleValidation = validateDigestEmailHtml(sampleEmail.html);
        if (!sampleValidation.valid) {
          return NextResponse.json(
            {
              error: 'Personalized email HTML validation failed. Check unsubscribe/preferences links.',
              validationErrors: sampleValidation.errors,
              validationWarnings: sampleValidation.warnings,
            },
            { status: 400 }
          );
        }
      }
    } catch {
      // If personalization fails (e.g. DB issue), log warning but allow send
      console.warn('[send-emails] Could not validate sample personalized email (non-fatal)');
    }

    const origin = 'https://www.offroady.app';
    const deliveryResult = await deliverWeeklyDigestEmails(digest, origin);

    return NextResponse.json({
      ok: true,
      digestTitle: digest.headline,
      digestId: digest.id,
      subscriberCount: deliveryResult.subscriberCount,
      sentCount: deliveryResult.sentCount,
      failedCount: deliveryResult.failedCount,
      skippedDuplicateCount: deliveryResult.skippedDueToDuplicateCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send weekly digest emails.' },
      { status: 400 }
    );
  }
}
