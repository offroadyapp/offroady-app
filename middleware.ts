import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ZH_SUFFIX = '-zh';

/**
 * Middleware to redirect old `/blog/:slug` URLs to the new language-aware paths.
 * Example: /blog/trail-difficulty-explained → /blog/en/trail-difficulty-explained
 * Example: /blog/mamquam-river-fsr-zh → /blog/zh/mamquam-river-fsr-zh
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // Match /blog/{slug} where slug has no trailing segments
  // This matches old-style URLs like /blog/some-post-slug
  const blogMatch = url.match(/^\/blog\/([^\/]+)$/);
  if (blogMatch) {
    const slug = blogMatch[1];

    // If the slug is already 'en' or 'zh', this is a new-style URL
    if (slug === 'en' || slug === 'zh') {
      return NextResponse.next();
    }

    // Detect language from slug suffix
    let targetLang: string;
    if (slug.endsWith(ZH_SUFFIX)) {
      targetLang = 'zh';
    } else {
      // Check cookie first, then accept-language header
      const cookieLang = request.cookies.get('offroady_lang')?.value;
      if (cookieLang === 'zh') {
        targetLang = 'zh';
      } else {
        const acceptLang = request.headers.get('accept-language') ?? '';
        targetLang = acceptLang.startsWith('zh') ? 'zh' : 'en';
      }
    }

    const newUrl = new URL(`/blog/${targetLang}/${slug}`, request.url);
    return NextResponse.redirect(newUrl, { status: 308 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/blog/:slug',
};
