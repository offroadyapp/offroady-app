export type Language = 'en' | 'zh';

export const LANGUAGES: Language[] = ['en', 'zh'];
export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_COOKIE = 'offroady_lang';
export const LANGUAGE_LOCAL_STORAGE_KEY = 'offroady_language';

export function isValidLanguage(value: string | null | undefined): value is Language {
  return value === 'en' || value === 'zh';
}

export function parseLanguage(value: string | null | undefined): Language {
  if (isValidLanguage(value)) return value;
  return DEFAULT_LANGUAGE;
}

/**
 * Parse Accept-Language header to detect browser language preference.
 * Returns 'zh' if the first accepted language starts with 'zh', else 'en'.
 */
export function getLanguageFromHeader(
  acceptLanguage: string | null | undefined
): Language {
  if (!acceptLanguage) return DEFAULT_LANGUAGE;

  const langs = acceptLanguage
    .split(',')
    .map((entry) => {
      const [lang] = entry.trim().split(';');
      return lang?.trim().toLowerCase() ?? '';
    })
    .filter(Boolean);

  for (const lang of langs) {
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('en')) return 'en';
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Resolve language for a request:
 * 1. Cookie takes priority (manual choice)
 * 2. Accept-Language header fallback
 * 3. Default to English
 */
export function getContentLanguage(
  acceptLanguage: string | null | undefined,
  langCookie: string | null | undefined
): Language {
  if (isValidLanguage(langCookie)) return langCookie;
  return getLanguageFromHeader(acceptLanguage);
}

const ZH_SLUG_SUFFIX = '-zh';

/**
 * Get the slug for a translation.
 */
export function getTranslationSlug(enSlug: string, lang: Language): string {
  if (lang === 'zh') return `${enSlug}${ZH_SLUG_SUFFIX}`;
  return enSlug;
}

/**
 * Given a slug with possible -zh suffix, strip it to get the canonical slug.
 */
export function stripLangSuffix(slug: string): string {
  if (slug.endsWith(ZH_SLUG_SUFFIX)) {
    return slug.slice(0, -ZH_SLUG_SUFFIX.length);
  }
  return slug;
}

/**
 * Detect language of a slug from its suffix.
 */
export function detectSlugLanguage(slug: string): Language {
  return slug.endsWith(ZH_SLUG_SUFFIX) ? 'zh' : 'en';
}

/**
 * Build the language-prefixed blog URL.
 */
export function buildBlogUrl(slug: string, lang: Language): string {
  return `/blog/${lang}/${slug}`;
}

/**
 * Build the plan URL for a trail (no language prefix needed).
 */
export function buildPlanUrl(trailSlug: string): string {
  return `/plan/${trailSlug}`;
}

/**
 * Get the other language.
 */
export function otherLanguage(lang: Language): Language {
  return lang === 'en' ? 'zh' : 'en';
}

/**
 * Language display names.
 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  zh: '中文',
};
