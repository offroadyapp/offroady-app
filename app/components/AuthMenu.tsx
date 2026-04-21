"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Viewer = {
  displayName: string;
  email: string;
  profileSlug: string | null;
  avatarImage: string | null;
};

type Props = {
  viewer: Viewer | null;
};

const accountLinks = [
  { href: '/my-account', label: 'My Account' },
  { href: '/my-profile', label: 'Profile' },
  { href: '/favorite-trails', label: 'Favorite Trails' },
  { href: '/favorite-trips', label: 'Favorite Trips' },
  { href: '/favorite-members', label: 'Favorite Members' },
  { href: '/favorite-crews', label: 'Favorite Crews' },
  { href: '/my-trips', label: 'My Trips' },
  { href: '/my-crews', label: 'My Crews' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/my-account/email-preferences', label: 'Email Preferences' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AuthMenu({ viewer }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const avatarLabel = useMemo(() => {
    if (!viewer) return '';
    return initials(viewer.displayName || viewer.email || 'O');
  }, [viewer]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  if (viewer) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex items-center gap-3 rounded-full border border-[#2f5d3a]/20 bg-[#eef5ee] px-2 py-2 pr-4 text-sm font-semibold text-[#243126] shadow-sm transition hover:scale-[1.01]"
          aria-label="My account"
        >
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#d8ead9] text-sm font-bold text-[#2f5d3a]">
            {viewer.avatarImage ? (
              <img src={viewer.avatarImage} alt={viewer.displayName} className="h-full w-full object-cover" />
            ) : (
              avatarLabel
            )}
          </span>
          <span className="hidden sm:block">My Account</span>
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-14 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
            <div className="border-b border-black/6 px-3 py-3">
              <div className="font-semibold text-[#243126]">{viewer.displayName}</div>
              <div className="text-xs text-gray-500">{viewer.email}</div>
            </div>
            <div className="py-1">
              {accountLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-[#f4f6f3]">
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
