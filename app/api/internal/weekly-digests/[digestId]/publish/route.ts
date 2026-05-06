import { NextResponse } from 'next/server';
import { hasInternalApiSecret } from '@/lib/offroady/internal';
import { publishWeeklyDigest, getWeeklyDigestById, buildPersonalizedDigestEmail } from '@/lib/offroady/weekly-digests';
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
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return 'https://www.offroady.app';
      }
    })();

    // Validate stored email HTML before publishing
    const digest = await getWeeklyDigestById(digestId);
    if (digest) {
      const emailHtml = digest.outputs.email_html?.content ?? null;
      if (emailHtml) {
        const htmlValidation = validateDigestEmailHtml(emailHtml);
        if (!htmlValidation.valid) {
          return NextResponse.json(
            {
              error: 'Email HTML validation failed. Refresh the digest to regenerate HTML, then try again.',
              validationErrors: htmlValidation.errors,
              validationWarnings: htmlValidation.warnings,
            },
            { status: 400 }
          );
        }
      }

      // Validate text version too
      const emailText = digest.outputs.email_text?.content ?? null;
      if (emailText) {
        const textValidation = validateDigestEmailText(emailText);
        if (!textValidation.valid) {
          return NextResponse.json(
            {
              error: 'Email text validation failed.',
              validationErrors: textValidation.errors,
              validationWarnings: textValidation.warnings,
            },
            { status: 400 }
          );
        }
      }

      // Also validate a sample personalized email
      try {
        const sampleEmail = await buildPersonalizedDigestEmail(digest, 'validation-test@offroady.app', 'https://www.offroady.app');
        if (sampleEmail.html) {
          const sampleValidation = validateDigestEmailHtml(sampleEmail.html);
          if (!sampleValidation.valid) {
            return NextResponse.json(
              {
                error: 'Personalized email HTML validation failed. Check unsubscribe/preferences links.',
                validationErrors: sampleValidation.errors,
              },
              { status: 400 }
            );
          }
        }
      } catch {
        console.warn('[publish] Could not validate sample personalized email (non-fatal)');
      }
    }

    const result = await publishWeeklyDigest(digestId, { origin });

    return NextResponse.json({
      ok: true,
      digestId: result.digestId,
      status: result.status,
      subscriberCount: result.subscriberCount,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      skippedDuplicateCount: result.skippedDuplicateCount,
      digest: result.digest,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish weekly digest.' },
      { status: 400 }
    );
  }
}
