type TransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OFFROADY_FROM_EMAIL || process.env.EMAIL_FROM;
  return {
    apiKey,
    from,
    enabled: Boolean(apiKey && from),
  };
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const config = getEmailConfig();
  if (!config.enabled || !config.apiKey || !config.from) {
    return { ok: false as const, skipped: true as const, reason: 'missing-email-provider-config' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      return { ok: false as const, skipped: false as const, reason: details || `email-send-failed-${response.status}` };
    }

    return { ok: true as const, skipped: false as const };
  } catch (error) {
    return {
      ok: false as const,
      skipped: false as const,
      reason: error instanceof Error ? error.message : 'email-send-threw',
    };
  }
}
