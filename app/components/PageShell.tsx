import type { ReactNode } from 'react';
import SiteHeader from './SiteHeader';
import { getSessionUser } from '@/lib/offroady/auth';

type Props = {
  children: ReactNode;
};

export default async function PageShell({ children }: Props) {
  const viewer = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#f4f6f3] text-[#2b2b2b]">
      <SiteHeader viewer={viewer} />
      {children}
    </div>
  );
}
