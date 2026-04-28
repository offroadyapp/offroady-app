export const OAUTH_PROVIDERS = ['google', 'facebook', 'apple'] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string | null | undefined): value is OAuthProvider {
  return OAUTH_PROVIDERS.includes(value as OAuthProvider);
}

export function getOAuthProviderLabel(provider: OAuthProvider) {
  switch (provider) {
    case 'google':
      return 'Google';
    case 'facebook':
      return 'Facebook';
    case 'apple':
      return 'Apple';
  }
}

export function sanitizeAuthRedirectPath(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return '/';
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/';
  return trimmed;
}
