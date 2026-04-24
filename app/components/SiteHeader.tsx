import Link from 'next/link';
import AuthMenu from './AuthMenu';
import type { SessionUser } from '@/lib/offroady/auth';

type Props = {
  viewer: SessionUser | null;
};

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/trail-of-the-week', label: 'Trail of the Week' },
  { href: '/join-a-trip', label: 'Join a Trip' },
  { href: '/community', label: 'Community' },
  { href: '/#more-trails', label: 'More Trails' },
  { href: '/about', label: 'About' },
];

const proposeTrailHref = '/propose-a-trail';
const joinTripHref = '/join-a-trip';

export default function SiteHeader({ viewer }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="Offroady logo"
            className="h-11 w-11 rounded-xl object-cover shadow-sm"
          />
          <div>
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-bold tracking-tight text-[#243126]">Offroady</div>
              <div className="text-sm font-semibold text-[#2f5d3a]">越野搭子</div>
            </div>
            <div className="text-xs text-gray-500">Trail-based off-road community in BC</div>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-[#2f5d3a]">
                {item.label}
              </Link>
            ))}
            <Link href={proposeTrailHref} className="rounded-full border border-[#2f5d3a]/20 bg-[#eef5ee] px-4 py-2 font-semibold text-[#2f5d3a] transition hover:bg-[#e3efe4]">
              Propose a Trail
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href={joinTripHref} className="inline-flex rounded-full border border-[#2f5d3a]/20 bg-white px-4 py-2 text-sm font-semibold text-[#2f5d3a] transition hover:bg-[#eef5ee] md:hidden">
              Join a Trip
            </Link>
            <Link href={proposeTrailHref} className="inline-flex rounded-full bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30] md:hidden">
              Propose a Trail
            </Link>
            <AuthMenu viewer={viewer} />
          </div>
        </div>
      </div>
    </header>
  );
}
