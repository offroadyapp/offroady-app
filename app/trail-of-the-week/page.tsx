import { redirect } from 'next/navigation';
import { getLatestWeeklyDigest } from '@/lib/offroady/weekly-digests';

export const dynamic = 'force-dynamic';

export default async function TrailOfTheWeekRedirectPage() {
  let digest = null;
  try {
    digest = await getLatestWeeklyDigest();
  } catch {
    digest = null;
  }
  if (digest) {
    redirect(`/weekly-digests/${digest.slug}`);
  }

  redirect('/');
}
