"use client";

import { useState } from 'react';

type Props = {
  initialProfile: {
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
  };
};

export default function ProfileEditor({ initialProfile }: Props) {
  const [editing, setEditing] = useState(false);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function removeImage(kind: 'avatar' | 'rig') {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/account/member-profile/media?kind=${kind}`, {
        method: 'DELETE',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to remove profile image');

      if (kind === 'avatar') {
        setAvatarFile(null);
        setAvatarPreview('');
      } else {
        setRigFile(null);
        setRigPreview('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove profile image');
    } finally {
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
    if (!file) return;

    const formData = new FormData();
    formData.set('kind', kind);
    formData.set('file', file);

    const response = await fetch('/api/account/member-profile/media', {
      method: 'POST',
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to upload profile image');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await uploadImage('avatar', avatarFile);
      await uploadImage('rig', rigFile);

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
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update profile');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Edit profile
      </button>
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
        <label className="block space-y-3">
          <span className="text-sm font-semibold text-[#243126]">Profile photo</span>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-[#eef5ee] text-xl font-bold text-[#2f5d3a]">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                'You'
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

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <button type="submit" disabled={loading} className="rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70">
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}
