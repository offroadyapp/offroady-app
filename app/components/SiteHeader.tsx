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

export default function SiteHeader({ viewer }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/icon.png"
              alt="Offroady logo"
              className="h-11 w-11 rounded-xl object-cover shadow-sm"
            />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-bold tracking-tight text-[#243126]">Offroady</div>
                <div className="text-sm font-semibold text-[#2f5d3a]">越野搭子</div>
              </div>
              <div className="truncate text-xs text-gray-500">Trail-based off-road community in BC</div>
            </div>
          </Link>
          <div className="shrink-0">
            <AuthMenu viewer={viewer} />
          </div>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm text-gray-600 md:mt-3 md:flex-wrap md:gap-6 md:overflow-visible md:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-black/5 bg-white px-3 py-2 transition hover:border-[#2f5d3a]/20 hover:text-[#2f5d3a] md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
