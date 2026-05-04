import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { getContentLanguage, type Language } from '@/lib/offroady/language';

export const dynamic = 'force-dynamic';

export default async function BlogRootPage() {
  const headersList = await headers();
  const cookieStore = await cookies();
  const lang: Language = getContentLanguage(
    headersList.get('accept-language'),
    cookieStore.get('offroady_lang')?.value ?? null
  );
  redirect(`/blog/${lang}`);
}
