import { NextResponse } from 'next/server';
import { requireInternalAccess } from '@/lib/offroady/internal';
import { getWeeklyDigestById, buildPersonalizedDigestEmail } from '@/lib/offroady/weekly-digests';
import { validateDigestEmailHtml } from '@/lib/offroady/email-validate';

export async function GET(request: Request, context: { params: Promise<{ digestId: string }> }) {
  try {
    await requireInternalAccess(request);

    const { digestId } = await context.params;

    const digest = await getWeeklyDigestById(digestId);
    if (!digest) {
      return NextResponse.json({ error: 'Weekly digest not found.' }, { status: 404 });
    }

    // Build a sample personalized email to show the full HTML with unsubscribe/preferences links
    const sampleEmail = await buildPersonalizedDigestEmail(digest, 'preview@offroady.app', 'https://www.offroady.app');

    const validation = sampleEmail.html
      ? validateDigestEmailHtml(sampleEmail.html)
      : null;

    return NextResponse.json({
      html: sampleEmail.html ?? digest.outputs.email_html?.content ?? '',
      text: sampleEmail.text,
      subject: sampleEmail.subject,
      validation: validation ? {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
      } : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview.' },
      { status: 400 }
    );
  }
}
