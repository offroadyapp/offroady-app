import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/offroady/email';
import { checkEmailRateLimit, checkIpRateLimit } from '@/lib/offroady/rate-limiter';
import { logEmailEvent, extractDomain } from '@/lib/offroady/email-logs';

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

      // Always return the same generic message — never reveal rate limiting or email existence
      return NextResponse.json({
        ok: true,
        message:
          'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.',
      });
    }

    // --- Generate reset link via Supabase admin API ---
    const serviceSupabase = getServiceSupabase();
    const { data: linkData, error: linkError } =
      await serviceSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: 'https://www.offroady.app/reset-password/confirm',
        },
      });

    if (linkError) {
      console.log(
        `[EMAIL:HARDENING] type=password-reset domain=${extractDomain(email)} status=generate-link-error error=${linkError.message}`
      );
      // Don't reveal whether the email exists — always return a generic message
      return NextResponse.json({
        ok: true,
        message:
          'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.',
      });
    }

    // --- Send via Resend with custom clean template ---
    const resetUrl = linkData?.properties?.action_link;
    if (!resetUrl) {
      console.log(
        `[EMAIL:HARDENING] type=password-reset domain=${extractDomain(email)} status=missing-action-link`
      );
      return NextResponse.json({
        ok: true,
        message:
          'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.',
      });
    }

    const html = `
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
                            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;background-color:#2f5d3a;border-radius:8px;text-decoration:none;">
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

    const text = [
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

    const result = await sendTransactionalEmail({
      to: email,
      subject: 'Reset your Offroady password',
      text,
      html,
    });

    // Structured logging
    logEmailEvent({
      emailType: 'password-reset',
      recipientDomain: extractDomain(email),
      providerStatus: result.ok ? (result.status ?? 'sent') : (result.status ?? 'failed'),
      messageId: result.messageId ?? undefined,
    });

    if (!result.ok) {
      console.log(
        `[EMAIL:HARDENING] type=password-reset domain=${extractDomain(email)} status=send-failed reason=${result.reason}`
      );
    }

    // Always return the same generic message
    return NextResponse.json({
      ok: true,
      message:
        'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    console.log(
      `[EMAIL:HARDENING] type=password-reset status=unexpected-error error=${message}`
    );
    return NextResponse.json({
      ok: true,
      message:
        'If this email is registered, we\'ll send a reset link shortly. Please check your inbox and spam folder.',
    });
  }
}
