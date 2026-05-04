'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  LANGUAGE_COOKIE,
  LANGUAGE_LOCAL_STORAGE_KEY,
  LANGUAGES,
  LANGUAGE_LABELS,
  type Language,
} from '@/lib/offroady/language';

type LanguageToggleProps = {
  currentLang: Language;
};

export default function LanguageToggle({ currentLang }: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLang(targetLang: Language) {
    // Save preference
    document.cookie = `${LANGUAGE_COOKIE}=${targetLang}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(LANGUAGE_LOCAL_STORAGE_KEY, targetLang);

    // Replace the language segment in the path
    // Current path: /blog/en/... or /blog/zh/...
    // We need to replace the lang segment
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length >= 2 && segments[0] === 'blog' && LANGUAGES.includes(segments[1] as Language)) {
      segments[1] = targetLang;
      const newPath = '/' + segments.join('/');
      router.push(newPath);
    } else {
      // Fallback: redirect to blog home in target language
      router.push(`/blog/${targetLang}`);
    }
  }

  return (
    <div className="inline-flex rounded-lg border border-black/8 bg-white p-0.5 shadow-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            lang === currentLang
              ? 'bg-[#2f5d3a] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
