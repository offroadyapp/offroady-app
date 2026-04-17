"use client";

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
    window.location.reload();
  }

  if (viewer) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[#2f5d3a]/20 bg-[#eef5ee] text-sm font-bold text-[#2f5d3a] shadow-sm transition hover:scale-[1.02]"
          aria-label="My account"
        >
          {viewer.avatarImage ? (
            <img src={viewer.avatarImage} alt={viewer.displayName} className="h-full w-full object-cover" />
          ) : (
            avatarLabel
          )}
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-14 z-40 w-56 rounded-2xl border border-black/8 bg-white p-2 shadow-xl">
            <div className="border-b border-black/6 px-3 py-3">
              <div className="font-semibold text-[#243126]">{viewer.displayName}</div>
              <div className="text-xs text-gray-500">{viewer.email}</div>
            </div>
            <a href="/my-account" className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-[#f4f6f3]">My account</a>
            <a href="/my-profile" className="block rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-[#f4f6f3]">My profile</a>
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

  return (
    <div className="flex items-center gap-2">
      <a
        href="#member-access"
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Log In
      </a>
      <a
        href="#member-access"
        className="rounded-lg bg-[#2f5d3a] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#264d30]"
      >
        Sign Up
      </a>
    </div>
  );
}
