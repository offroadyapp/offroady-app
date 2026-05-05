import { NextResponse } from 'next/server';
import { getServiceSupabase, getServerAuthSupabase } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/offroady/email';
import { checkEmailRateLimit, checkIpRateLimit } from '@/lib/offroady/rate-limiter';
import { logEmailEvent, extractDomain } from '@/lib/offroady/email-logs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.offroady.app';

const GENERIC_SUCCESS_MESSAGE =
  'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // --- Rate limiting ---
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const emailLimit = checkEmailRateLimit(email);
    const ipLimit = checkIpRateLimit(ip);
    const suppressed = !emailLimit.allowed || !ipLimit.allowed;

    if (suppressed) {
      logEmailEvent({
        emailType: 'password-reset',
        recipientDomain: extractDomain(email),
        providerStatus: 'rate-limited',
        suppressed: true,
      });
      return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
    }

    const domain = extractDomain(email);

    // --- Strategy: Try generateLink first for existing auth users, fall back to Supabase's own email ---
    // generateLink() works for users in Supabase Auth and returns a reset URL we can send via Resend
    // For non-existent users (or API errors), we fall through silently to resetPasswordForEmail()
    const serviceSupabase = getServiceSupabase();
    const { data: linkData, error: linkError } =
      await serviceSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${SITE_URL}/reset-password/confirm`,
        },
      });

    const resetUrl = linkData?.properties?.action_link;

    if (resetUrl && !linkError) {
      // --- Send via Resend with custom clean template ---
      const html = buildResetEmailHtml(resetUrl);
      const text = buildResetEmailText(resetUrl);

      const result = await sendTransactionalEmail({
        to: email,
        subject: 'Reset your Offroady password',
        text,
        html,
      });

      logEmailEvent({
        emailType: 'password-reset',
        recipientDomain: domain,
        providerStatus: result.ok ? (result.status ?? 'sent') : (result.status ?? 'failed'),
        messageId: result.messageId ?? undefined,
      });

      if (!result.ok) {
        console.log(
          `[EMAIL:HARDENING] type=password-reset domain=${domain} status=resend-failed reason=${result.reason}`
        );
        // Resend failed — fall through to Supabase's own email as backup
      } else {
        return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
      }
    } else {
      if (linkError) {
        // generateLink returns 404 for users not in Supabase Auth
        // This is expected — don't log as an error, just fall through
        console.log(
          `[EMAIL:HARDENING] type=password-reset domain=${domain} status=generate-link-not-available info=user-not-in-auth-or-other-reason`
        );
      } else {
        console.log(
          `[EMAIL:HARDENING] type=password-reset domain=${domain} status=generate-link-no-action-link`
        );
      }
    }

    // --- Fallback: Use Supabase's built-in resetPasswordForEmail ---
    // This works for both existing and non-existing auth users without revealing existence
    // Supabase handles the email delivery through its own email system
    const authSupabase = getServerAuthSupabase();
    const { error: resetError } = await authSupabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password/confirm`,
    });

    if (resetError) {
      console.log(
        `[EMAIL:HARDENING] type=password-reset domain=${domain} status=supabase-fallback-failed error=${resetError.message}`
      );
    }

    logEmailEvent({
      emailType: 'password-reset',
      recipientDomain: domain,
      providerStatus: 'supabase-fallback-sent',
    });

    // Always return the same generic message
    return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    console.log(
      `[EMAIL:HARDENING] type=password-reset status=unexpected-error error=${message}`
    );
    return NextResponse.json({ ok: true, message: GENERIC_SUCCESS_MESSAGE });
  }
}

function buildResetEmailHtml(resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f6f3;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f3;padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:40px 32px 32px 32px;">
                    <h1 style="margin:0 0 8px 0;font-size:22px;color:#243126;font-weight:700;">Reset your Offroady password</h1>
                    <p style="margin:0 0 24px 0;font-size:15px;color:#5b6b5e;line-height:1.5;">
                      You requested a password reset for your Offroady account. Click the button below to set a new password.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius:8px;">
                          <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;background-color:#1b5e2a;border-radius:8px;text-decoration:none;">
                            Reset password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 16px 0;font-size:13px;color:#8a9b8e;line-height:1.5;">
                      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
                    </p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 16px 0;" />
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                      Offroady &middot; British Columbia, Canada
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildResetEmailText(resetUrl: string): string {
  return [
    'Reset your Offroady password',
    '',
    'You requested a password reset for your Offroady account. Click the link below to set a new password:',
    '',
    resetUrl,
    '',
    'This link expires in 1 hour. If you didn\'t request this, you can safely ignore this email.',
    '',
    '— Offroady',
  ].join('\n');
}
