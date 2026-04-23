export const EMAIL_SHARE_AUTH_REQUIRED_CODE = 'auth-required-for-email-share';
export const EMAIL_SHARE_UNAVAILABLE_CODE = 'email-share-unavailable';

export const EMAIL_SHARE_AUTH_REQUIRED_MESSAGE = 'Please sign up or log in to share this by email.';
export const EMAIL_SHARE_MEMBERS_ONLY_MESSAGE = 'Email sharing is available for members only. Please sign up or log in first.';
export const EMAIL_SHARE_UNAVAILABLE_MESSAGE = 'Email sharing is temporarily unavailable. Please try again later.';

export function getEmailShareErrorMessage(code?: string | null, fallback?: string | null) {
  if (code === EMAIL_SHARE_AUTH_REQUIRED_CODE) return EMAIL_SHARE_AUTH_REQUIRED_MESSAGE;
  if (code === EMAIL_SHARE_UNAVAILABLE_CODE) return EMAIL_SHARE_UNAVAILABLE_MESSAGE;
  return fallback || 'Email sharing could not be completed. Please try again later.';
}
