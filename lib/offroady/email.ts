type TransactionalEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type TransactionalEmailDebugInfo = {
  provider: 'resend';
  enabled: boolean;
  hasApiKey: boolean;
  hasFrom: boolean;
  from: string | null;
  missingConfig: string[];
};

export type TransactionalEmailResult = {
  ok: boolean;
  skipped: boolean;
  provider: 'resend';
  from: string | null;
  missingConfig: string[];
  reason: string;
  status?: number;
  messageId?: string | null;
  accepted?: boolean;
  providerResponseSummary?: string | null;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OFFROADY_FROM_EMAIL || process.env.EMAIL_FROM;
  const missingConfig: string[] = [];

  if (!apiKey) missingConfig.push('RESEND_API_KEY');
  if (!from) missingConfig.push('OFFROADY_FROM_EMAIL|EMAIL_FROM');

  return {
    provider: 'resend' as const,
    apiKey,
    from,
    enabled: missingConfig.length === 0,
    missingConfig,
  };
}

function summarizeProviderPayload(payload: unknown) {
  if (payload == null) return null;
  if (typeof payload === 'string') return payload.slice(0, 400);

  try {
    return JSON.stringify(payload).slice(0, 400);
  } catch {
    return '[unserializable-provider-response]';
  }
}

async function readProviderPayload(response: Response) {
  const text = await response.text().catch(() => '');
  if (!text) return { rawText: '', parsed: null as unknown };

  try {
    return { rawText: text, parsed: JSON.parse(text) as unknown };
  } catch {
    return { rawText: text, parsed: null as unknown };
  }
}

export function getTransactionalEmailDebugInfo(): TransactionalEmailDebugInfo {
  const config = getEmailConfig();
  return {
    provider: config.provider,
    enabled: config.enabled,
    hasApiKey: Boolean(config.apiKey),
    hasFrom: Boolean(config.from),
    from: config.from ?? null,
    missingConfig: [...config.missingConfig],
  };
}

export async function sendTransactionalEmail(input: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const config = getEmailConfig();
  if (!config.enabled || !config.apiKey || !config.from) {
    return {
      ok: false,
      skipped: true,
      provider: config.provider,
      from: config.from ?? null,
      missingConfig: [...config.missingConfig],
      reason: 'missing-email-provider-config',
    };
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

    const payload = await readProviderPayload(response);
    const parsed = payload.parsed && typeof payload.parsed === 'object' ? payload.parsed as { id?: unknown; message?: unknown; name?: unknown } : null;
    const messageId = typeof parsed?.id === 'string' ? parsed.id : null;
    const providerResponseSummary = summarizeProviderPayload(payload.parsed ?? payload.rawText);

    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        provider: config.provider,
        from: config.from,
        missingConfig: [],
        status: response.status,
        reason: payload.rawText || `email-send-failed-${response.status}`,
        providerResponseSummary,
      };
    }

    return {
      ok: true,
      skipped: false,
      provider: config.provider,
      from: config.from,
      missingConfig: [],
      status: response.status,
      messageId,
      accepted: true,
      reason: 'sent',
      providerResponseSummary,
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      provider: config.provider,
      from: config.from,
      missingConfig: [],
      reason: error instanceof Error ? error.message : 'email-send-threw',
      providerResponseSummary: null,
    };
  }
}
