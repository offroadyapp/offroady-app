import type { Language } from '@/lib/offroady/language';

type LanguageFallbackNoticeProps = {
  currentLang: Language;
  availableLang: Language;
};

const NOTICES: Record<Language, Record<Language, string>> = {
  en: {
    en: '',
    zh: 'This story is currently available in English only.',
  },
  zh: {
    en: '这篇文章目前只有英文版。',
    zh: '',
  },
};

export default function LanguageFallbackNotice({
  currentLang,
  availableLang,
}: LanguageFallbackNoticeProps) {
  if (currentLang === availableLang) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      {NOTICES[currentLang]?.[availableLang] ?? NOTICES.en.zh}
    </div>
  );
}
