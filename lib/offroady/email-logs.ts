/**
 * Structured logging for email events.
 * All logs use [EMAIL:HARDENING] prefix for easy filtering in production logs.
 */

export type EmailEvent = {
  /** The type of email being sent, e.g. 'password-reset', 'weekly-digest' */
  emailType: string;
  /** The domain part of the recipient email, e.g. 'gmail.com' */
  recipientDomain: string;
  /** HTTP status from the email provider, or 'skipped' if not sent */
  providerStatus: number | string;
  /** Message ID from the email provider, if available */
  messageId?: string | null;
  /** Whether the request was suppressed due to rate limiting */
  suppressed?: boolean;
  /** Any additional context that doesn't contain PII */
  extra?: Record<string, unknown>;
};

function extractDomain(email: string): string {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return 'unknown';
  return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Log an email event with structured fields.
 * All logging is done via console with [EMAIL:HARDENING] prefix.
 */
export function logEmailEvent(event: EmailEvent): void {
  const parts: string[] = [
    `type=${event.emailType}`,
    `domain=${event.recipientDomain}`,
    `status=${event.providerStatus}`,
  ];

  if (event.messageId) {
    parts.push(`msgId=${event.messageId}`);
  }

  if (event.suppressed) {
    parts.push('suppressed=true');
  }

  if (event.extra && Object.keys(event.extra).length > 0) {
    parts.push(`extra=${JSON.stringify(event.extra)}`);
  }

  console.log(`[EMAIL:HARDENING] ${parts.join(' ')}`);
}

export { extractDomain };
