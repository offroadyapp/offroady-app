import Link from 'next/link';
import AuthMenu from './AuthMenu';
import type { SessionUser } from '@/lib/offroady/auth';

type Props = {
  viewer: SessionUser | null;
};

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/#featured', label: 'Trail of the Week' },
  { href: '/#community', label: 'Community' },
  { href: '/about', label: 'About' },
];

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
          </nav>
          <AuthMenu viewer={viewer} />
        </div>
      </div>
    </header>
  );
}
