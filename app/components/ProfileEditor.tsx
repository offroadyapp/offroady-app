"use client";

import { useState } from 'react';

export type EditableProfile = {
  displayName: string;
  bio: string;
  avatarImage: string;
  rigName: string;
  rigPhoto: string;
  rigMods: string[];
  experienceSince: number | null;
  areasDriven: string[];
  petName: string;
  petNote: string;
  shareVibe: string;
  isVisible: boolean;
};

type Props = {
  initialProfile: EditableProfile;
  onProfileUpdated?: (profile: EditableProfile) => void;
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

export default function ProfileEditor({ initialProfile, onProfileUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [bio, setBio] = useState(initialProfile.bio);
  const [avatarPreview, setAvatarPreview] = useState(initialProfile.avatarImage);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [rigName, setRigName] = useState(initialProfile.rigName);
  const [rigPreview, setRigPreview] = useState(initialProfile.rigPhoto);
  const [rigFile, setRigFile] = useState<File | null>(null);
  const [rigMods, setRigMods] = useState(initialProfile.rigMods.join(', '));
  const [experienceSince, setExperienceSince] = useState(initialProfile.experienceSince ? String(initialProfile.experienceSince) : '');
  const [areasDriven, setAreasDriven] = useState(initialProfile.areasDriven.join(', '));
  const [petName, setPetName] = useState(initialProfile.petName);
  const [petNote, setPetNote] = useState(initialProfile.petNote);
  const [shareVibe, setShareVibe] = useState(initialProfile.shareVibe);
  const [isVisible, setIsVisible] = useState(initialProfile.isVisible);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activity, setActivity] = useState('');

  function snapshot(overrides?: Partial<EditableProfile>): EditableProfile {
    return {
      displayName,
      bio,
      avatarImage: avatarPreview,
      rigName,
      rigPhoto: rigPreview,
      rigMods: rigMods.split(',').map((item) => item.trim()).filter(Boolean),
      experienceSince: experienceSince ? Number(experienceSince) : null,
      areasDriven: areasDriven.split(',').map((item) => item.trim()).filter(Boolean),
      petName,
      petNote,
      shareVibe,
      isVisible,
      ...overrides,
    };
  }

  async function removeImage(kind: 'avatar' | 'rig') {
    setLoading(true);
    setError('');
    setSuccess('');
    setActivity(kind === 'avatar' ? 'Removing avatar...' : 'Removing rig photo...');

    try {
      const response = await fetch(`/api/account/member-profile/media?kind=${kind}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to remove profile image');

      if (kind === 'avatar') {
        setAvatarFile(null);
        setAvatarPreview('');
        onProfileUpdated?.(snapshot({ avatarImage: '' }));
        setSuccess('Avatar removed');
      } else {
        setRigFile(null);
        setRigPreview('');
        onProfileUpdated?.(snapshot({ rigPhoto: '' }));
        setSuccess('Rig photo removed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove profile image');
    } finally {
      setActivity('');
      setLoading(false);
    }
  }

  function handleImageChange(kind: 'avatar' | 'rig', file: File | null) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);

    if (kind === 'avatar') {
      setAvatarFile(file);
      setAvatarPreview(previewUrl);
      return;
    }

    setRigFile(file);
    setRigPreview(previewUrl);
  }

  async function uploadImage(kind: 'avatar' | 'rig', file: File | null) {
    if (!file) return null;

    setActivity(kind === 'avatar' ? 'Uploading avatar...' : 'Uploading rig photo...');

    const formData = new FormData();
    formData.set('kind', kind);
    formData.set('file', file);

    const response = await fetch('/api/account/member-profile/media', {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to upload profile image');
    return payload.imageUrl as string;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setActivity('Saving profile...');

    try {
      setActivity('Saving display name...');
      const displayNameResponse = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName }),
      });
      const displayNamePayload = await displayNameResponse.json();
      if (!displayNameResponse.ok) throw new Error(displayNamePayload.error || 'Failed to update display name');

      const uploadedAvatarUrl = await uploadImage('avatar', avatarFile);
      const uploadedRigUrl = await uploadImage('rig', rigFile);

      setActivity('Saving profile details...');
      const response = await fetch('/api/account/member-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          rigName,
          rigMods: rigMods.split(',').map((item) => item.trim()).filter(Boolean),
          experienceSince: experienceSince ? Number(experienceSince) : null,
          areasDriven: areasDriven.split(',').map((item) => item.trim()).filter(Boolean),
          petName,
          petNote,
          shareVibe,
          isVisible,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update profile');

      const nextProfile: EditableProfile = {
        displayName: displayNamePayload.profile?.display_name || displayName,
        bio: payload.profile.bio || '',
        avatarImage: uploadedAvatarUrl ?? avatarPreview,
        rigName: payload.profile.rig_name || '',
        rigPhoto: uploadedRigUrl ?? rigPreview,
        rigMods: payload.profile.rig_mods || [],
        experienceSince: payload.profile.experience_since || null,
        areasDriven: payload.profile.areas_driven || [],
        petName: payload.profile.pet_name || '',
        petNote: payload.profile.pet_note || '',
        shareVibe: payload.profile.share_vibe || '',
        isVisible: payload.profile.is_visible ?? true,
      };

      setAvatarFile(null);
      setRigFile(null);
      setDisplayName(nextProfile.displayName);
      setAvatarPreview(nextProfile.avatarImage);
      setRigPreview(nextProfile.rigPhoto);
      setRigMods(nextProfile.rigMods.join(', '));
      setAreasDriven(nextProfile.areasDriven.join(', '));
      onProfileUpdated?.(nextProfile);
      setSuccess('Profile saved');
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setActivity('');
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="space-y-3">
        {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div> : null}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Edit profile
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-black/8 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Edit profile</p>
          <h2 className="mt-2 text-2xl font-bold text-[#243126]">Update your profile</h2>
        </div>
        <button type="button" onClick={() => setEditing(false)} className="text-sm text-gray-500">Cancel</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm font-semibold text-[#243126]">Display name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name, with your rig short title if you want" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" maxLength={50} />
          <p className="text-xs text-gray-500">This is what other members will see across your profile, trips, and community messages.</p>
        </label>

        <label className="block space-y-3">
          <span className="text-sm font-semibold text-[#243126]">Profile photo</span>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#eef5ee] text-xl font-bold text-[#2f5d3a]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                initialsFor(displayName)
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => handleImageChange('avatar', event.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef5ee] file:px-3 file:py-2 file:font-semibold file:text-[#2f5d3a]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xs text-gray-500">Upload or replace your avatar. JPG, PNG, WEBP, or GIF, up to 5MB.</p>
                {avatarFile ? <p className="text-xs font-semibold text-[#2f5d3a]">Ready to upload new avatar</p> : null}
                {avatarPreview ? (
                  <button
                    type="button"
                    onClick={() => void removeImage('avatar')}
                    disabled={loading}
                    className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Remove current avatar
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </label>

        <label className="block space-y-3">
          <span className="text-sm font-semibold text-[#243126]">Rig photo</span>
          <div className="space-y-3">
            {rigPreview ? (
              <div className="overflow-hidden rounded-2xl border border-black/8">
                <img src={rigPreview} alt="Rig preview" className="h-36 w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
                No rig photo yet
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => handleImageChange('rig', event.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef5ee] file:px-3 file:py-2 file:font-semibold file:text-[#2f5d3a]"
            />
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs text-gray-500">Upload or replace the vehicle photo people see on your profile.</p>
              {rigFile ? <p className="text-xs font-semibold text-[#2f5d3a]">Ready to upload new rig photo</p> : null}
              {rigPreview ? (
                <button
                  type="button"
                  onClick={() => void removeImage('rig')}
                  disabled={loading}
                  className="text-xs font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove current rig photo
                </button>
              ) : null}
            </div>
          </div>
        </label>
      </div>

      <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={4} placeholder="Bio" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={rigName} onChange={(event) => setRigName(event.target.value)} placeholder="Rig name" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={rigMods} onChange={(event) => setRigMods(event.target.value)} placeholder="Rig mods, comma separated" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={experienceSince} onChange={(event) => setExperienceSince(event.target.value)} placeholder="Experience since (year)" type="number" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={areasDriven} onChange={(event) => setAreasDriven(event.target.value)} placeholder="Areas driven, comma separated" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={petName} onChange={(event) => setPetName(event.target.value)} placeholder="Pet name" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={petNote} onChange={(event) => setPetNote(event.target.value)} placeholder="Pet note" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />
      <input value={shareVibe} onChange={(event) => setShareVibe(event.target.value)} placeholder="Trail vibe" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]" />

      <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-semibold text-[#243126]">Community visibility</div>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              When visible, other members can find and contact you for trips. When hidden, you will not appear in the community and you will not receive new invites.
            </p>
          </div>
          <label className="inline-flex items-center gap-3 rounded-full border border-[#d7e5d9] bg-white px-4 py-2 text-sm font-semibold text-[#243126]">
            <input type="checkbox" checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#2f5d3a] focus:ring-[#2f5d3a]" />
            {isVisible ? 'Visible to community' : 'Hidden from community'}
          </label>
        </div>
      </div>

      {activity ? <div className="rounded-lg border border-[#cfe3d3] bg-[#f4faf5] px-3 py-2 text-sm text-[#2f5d3a]">{activity}</div> : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div> : null}

      <button type="submit" disabled={loading} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70">
        {loading ? activity || 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}
