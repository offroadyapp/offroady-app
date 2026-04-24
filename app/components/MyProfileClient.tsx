"use client";

import { useState } from 'react';
import ProfileEditor, { type EditableProfile } from './ProfileEditor';

type Props = {
  initialProfile: EditableProfile;
  profileSlug: string;
};

function initialsFor(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';
}

export default function MyProfileClient({ initialProfile, profileSlug }: Props) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <>
      <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-[#eef5ee] text-3xl font-bold text-[#2f5d3a] shadow-sm">
            {profile.avatarImage ? (
              <img src={profile.avatarImage} alt={profile.displayName} className="h-full w-full object-cover" />
            ) : (
              initialsFor(profile.displayName)
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">My profile</p>
                <h1 className="mt-2 text-3xl font-bold text-[#243126]">{profile.displayName}</h1>
                <p className="mt-1 text-sm text-gray-500">@{profileSlug}</p>
              </div>
              <ProfileEditor initialProfile={profile} onProfileUpdated={setProfile} />
            </div>
            <p className="mt-4 max-w-3xl leading-7 text-gray-700">{profile.bio || 'No bio yet.'}</p>
            <div className="mt-4 inline-flex rounded-full bg-[#eef5ee] px-3 py-1 text-sm font-semibold text-[#2f5d3a]">
              {profile.isVisible ? 'Visible to community' : 'Hidden from community'}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Rig</p>
          <h2 className="mt-2 text-2xl font-bold text-[#243126]">Vehicle setup</h2>
          <div className="mt-5 space-y-3 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-[#243126]">Rig:</span> {profile.rigName || 'Not added yet'}
            </div>
            <div>
              <span className="font-semibold text-[#243126]">Experience since:</span> {profile.experienceSince || '—'}
            </div>
            <div>
              <span className="font-semibold text-[#243126]">Mods:</span>{' '}
              {profile.rigMods.length ? profile.rigMods.join(' · ') : 'No mods listed yet'}
            </div>
          </div>
          {profile.rigPhoto ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-black/8">
              <img src={profile.rigPhoto} alt={profile.rigName || profile.displayName} className="h-64 w-full object-cover" />
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Trail identity</p>
          <h2 className="mt-2 text-2xl font-bold text-[#243126]">How people get to know you</h2>
          <div className="mt-5 space-y-4 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-[#243126]">Areas driven:</span>{' '}
              {profile.areasDriven.length ? profile.areasDriven.join(' · ') : 'Not added yet'}
            </div>
            <div>
              <span className="font-semibold text-[#243126]">Trail vibe:</span> {profile.shareVibe || 'No profile vibe yet'}
            </div>
            <div>
              <span className="font-semibold text-[#243126]">Pet co-pilot:</span>{' '}
              {profile.petName ? `${profile.petName} — ${profile.petNote || ''}` : 'No pet note yet'}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
