'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StoryTrailSelector from '@/app/components/StoryTrailSelector';
import MDXEditorWrapper from '@/app/components/MDXEditorWrapper';
import StoryPreviewModal from '@/app/components/StoryPreviewModal';
import PublishSuccessPanel from '@/app/components/PublishSuccessPanel';
import ActionToast from '@/app/components/ActionToast';
import { extractYoutubeId, MAX_PHOTOS_PER_STORY, MAX_YOUTUBE_PER_STORY } from '@/lib/offroady/stories';

type UploadedPhoto = {
  storage_path: string;
  public_url: string;
  byte_size: number;
  mime_type: string;
  alt_text: string;
  is_cover: boolean;
};

type YoutubeLink = {
  url: string;
  video_id: string;
  title: string;
};

type TrailData = {
  relatedTrailSlug: string | null;
  trailLinkStatus: 'linked' | 'proposed' | 'unlinked';
  proposedTrailName?: string;
  proposedTrailArea?: string;
  proposedTrailMapUrl?: string;
  proposedTrailNotes?: string;
};

const GUIDELINES = [
  'Real stories only — share your genuine off-road experience.',
  'Do not post private personal information.',
  'Do not upload photos without permission.',
  'Do not encourage unsafe or illegal driving.',
  'Do not share closed/private land access details if unsure.',
  'Keep it respectful and useful for the community.',
];

type EditStory = {
  id: string;
  slug: string;
  title: string;
  story_body: string;
  excerpt: string | null;
  trip_date: string | null;
  vehicle: string | null;
  safety_notes: string | null;
  recommended_for_beginners: boolean | null;
  related_trail_slug: string | null;
  trail_link_status: string;
  proposed_trail_name: string | null;
  proposed_trail_area: string | null;
  proposed_trail_map_url: string | null;
  proposed_trail_notes: string | null;
  status: string;
  hidden_by_admin: boolean | null;
  rights_confirmed: boolean;
  photos: Array<{
    storage_path: string;
    public_url: string;
    alt_text: string | null;
    is_cover: boolean;
    byte_size: number | null;
    mime_type: string | null;
    sort_order: number;
  }>;
  youtube_videos: Array<{
    original_url: string;
    video_id: string;
    title: string | null;
    sort_order: number;
  }>;
};

export default function StorySubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSlug = searchParams.get('trail');
  const editSlug = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [storyBody, setStoryBody] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [recommendedForBeginners, setRecommendedForBeginners] = useState(false);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  const [trailData, setTrailData] = useState<TrailData>({
    relatedTrailSlug: null,
    trailLinkStatus: 'unlinked',
  });

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLink[]>([]);
  const [youtubeInput, setYoutubeInput] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Preview and publish state
  const [showPreview, setShowPreview] = useState(false);
  const [publishAction, setPublishAction] = useState<'draft' | 'publish'>('publish');

  // Publish success state
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [publishedTitle, setPublishedTitle] = useState('');

  // Edit mode state
  const [editStory, setEditStory] = useState<EditStory | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load existing story for editing
  useEffect(() => {
    if (!editSlug) return;

    setLoadingEdit(true);
    fetch(`/api/stories/${editSlug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load story');
        return res.json();
      })
      .then((data) => {
        const story = data.story as EditStory;
        setEditStory(story);
        setTitle(story.title);
        setStoryBody(story.story_body);
        setExcerpt(story.excerpt || '');
        setTripDate(story.trip_date || '');
        setVehicle(story.vehicle || '');
        setSafetyNotes(story.safety_notes || '');
        setRecommendedForBeginners(story.recommended_for_beginners || false);
        setRightsConfirmed(story.rights_confirmed);
        setTrailData({
          relatedTrailSlug: story.related_trail_slug,
          trailLinkStatus: (story.trail_link_status as TrailData['trailLinkStatus']) || 'unlinked',
          proposedTrailName: story.proposed_trail_name || undefined,
          proposedTrailArea: story.proposed_trail_area || undefined,
          proposedTrailMapUrl: story.proposed_trail_map_url || undefined,
          proposedTrailNotes: story.proposed_trail_notes || undefined,
        });
        setPhotos(
          (story.photos || []).map((p) => ({
            storage_path: p.storage_path,
            public_url: p.public_url,
            byte_size: p.byte_size || 0,
            mime_type: p.mime_type || 'image/jpeg',
            alt_text: p.alt_text || '',
            is_cover: p.is_cover,
          }))
        );
        setYoutubeLinks(
          (story.youtube_videos || []).map((v) => ({
            url: v.original_url,
            video_id: v.video_id,
            title: v.title || '',
          }))
        );
      })
      .catch((err) => {
        setError(err.message || 'Failed to load story for editing');
      })
      .finally(() => setLoadingEdit(false));
  }, [editSlug]);

  const handleTrailChange = useCallback((data: TrailData) => {
    setTrailData(data);
  }, []);

  // Photo upload handler
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    if (photos.length + files.length > MAX_PHOTOS_PER_STORY) {
      setError(`Maximum ${MAX_PHOTOS_PER_STORY} photos allowed.`);
      return;
    }

    setUploadingPhoto(true);
    setError('');

    try {
      const storyId = '__temp__';

      for (const file of Array.from(files)) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
          setError(`Invalid file type: ${file.type}. Only JPG, PNG, WebP allowed.`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError(`File too large: ${file.name}. Max 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('storyId', storyId);

        const res = await fetch('/api/stories/upload-photo', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Upload failed');
          continue;
        }

        const data = await res.json();
        setPhotos((prev) => [
          ...prev,
          {
            storage_path: data.storage_path,
            public_url: data.public_url,
            byte_size: data.byte_size,
            mime_type: data.mime_type,
            alt_text: '',
            is_cover: prev.length === 0,
          },
        ]);
      }

      setToast(`${files.length} photo(s) uploaded`);
    } catch {
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function setPhotoAlt(index: number, alt: string) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, alt_text: alt } : p)));
  }

  function setCoverPhoto(index: number) {
    setPhotos((prev) => prev.map((p, i) => ({ ...p, is_cover: i === index })));
  }

  // YouTube handler
  function addYoutubeLink() {
    const videoId = extractYoutubeId(youtubeInput.trim());
    if (!videoId) {
      setError('Invalid YouTube URL. Only youtube.com and youtu.be links are accepted.');
      return;
    }

    if (youtubeLinks.length >= MAX_YOUTUBE_PER_STORY) {
      setError(`Maximum ${MAX_YOUTUBE_PER_STORY} YouTube videos allowed.`);
      return;
    }

    if (youtubeLinks.some((l) => l.video_id === videoId)) {
      setError('This video has already been added.');
      return;
    }

    setYoutubeLinks((prev) => [
      ...prev,
      { url: youtubeInput.trim(), video_id: videoId, title: youtubeTitle.trim() },
    ]);
    setYoutubeInput('');
    setYoutubeTitle('');
    setError('');
  }

  function removeYoutubeLink(index: number) {
    setYoutubeLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function sendSubmit() {
    setError('');

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!storyBody.trim()) {
      setError('Story body is required.');
      return;
    }
    if (!rightsConfirmed) {
      setError('You must confirm you own these photos or have permission to share them.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        story_body: storyBody.trim(),
        excerpt: excerpt.trim() || null,
        trip_date: tripDate || null,
        vehicle: vehicle.trim() || null,
        safety_notes: safetyNotes.trim() || null,
        recommended_for_beginners: recommendedForBeginners,
        rights_confirmed: true,
        related_trail_slug: trailData.relatedTrailSlug,
        trail_link_status: trailData.trailLinkStatus,
        proposed_trail_name: trailData.proposedTrailName,
        proposed_trail_area: trailData.proposedTrailArea,
        proposed_trail_map_url: trailData.proposedTrailMapUrl,
        proposed_trail_notes: trailData.proposedTrailNotes,
        status: publishAction === 'publish' ? 'published' : 'draft',
        photos: photos.map((p) => ({
          storage_path: p.storage_path,
          public_url: p.public_url,
          alt_text: p.alt_text,
          is_cover: p.is_cover,
          byte_size: p.byte_size,
          mime_type: p.mime_type,
        })),
        youtube_links: youtubeLinks.map((y) => ({
          url: y.url,
          title: y.title,
        })),
      };

      if (editSlug) {
        // Editing existing story
        const res = await fetch(`/api/stories/${editSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update story');

        if (publishAction === 'publish') {
          setPublishedSlug(editSlug);
          setPublishedTitle(title.trim());
          setShowPreview(false);
        } else {
          setToast('Draft updated!');
          router.push('/my-stories');
        }
      } else {
        // Creating new story
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error(data.error || 'Daily publish limit reached. Save as draft and try again tomorrow.');
          }
          throw new Error(data.error || 'Failed to submit story');
        }

        if (publishAction === 'publish') {
          setPublishedSlug(data.story.slug);
          setPublishedTitle(title.trim());
          setShowPreview(false);
        } else {
          setToast('Draft saved!');
          router.push('/my-stories');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit story');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowPreview(true);
  }

  function handlePublishIntent(mode: 'draft' | 'publish') {
    setPublishAction(mode);
    setShowPreview(true);
  }

  // Preview data
  const previewPhotoUrls = photos
    .sort((a, b) => (a.is_cover ? -1 : 1) - (b.is_cover ? -1 : 1))
    .map((p) => p.public_url);

  const previewYoutubeUrls = youtubeLinks.map((y) => ({
    url: y.url,
    title: y.title,
  }));

  // ─── Publish Success Screen ───
  if (publishedSlug) {
    return <PublishSuccessPanel slug={publishedSlug} title={publishedTitle} />;
  }

  // ─── Preview Modal ───
  if (showPreview) {
    return (
      <>
        <StoryPreviewModal
          title={title}
          storyBody={storyBody}
          excerpt={excerpt}
          photoUrls={previewPhotoUrls}
          youtubeUrls={previewYoutubeUrls}
          onBackToEdit={() => setShowPreview(false)}
          onSubmit={sendSubmit}
          submitting={submitting}
        />
      </>
    );
  }

  if (loadingEdit) {
    return (
      <div className="space-y-8">
        <div className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          Loading story for editing...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {editSlug && editStory && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Editing: <strong>{editStory.title}</strong>
          {editStory.status === 'published' && (
            <span className="ml-2">— Editing will place it back in unreviewed moderation.</span>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[#243126]">
          Story title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your trail story a catchy title"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
          required
          maxLength={200}
        />
      </div>

      {/* Trail Selector */}
      <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
        <h3 className="text-sm font-semibold text-[#243126]">Where did this trip happen?</h3>
        <p className="mt-1 text-xs text-gray-500">
          Link your story to a trail (optional). You can suggest a new trail if you don&apos;t find one.
        </p>
        <div className="mt-3">
          <StoryTrailSelector
            value={trailData.relatedTrailSlug}
            onChange={handleTrailChange}
            preSelectedSlug={preSelectedSlug}
          />
        </div>
      </div>

      {/* Trip Date & Vehicle */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="tripDate" className="block text-sm font-medium text-[#243126]">
            Trip date (optional)
          </label>
          <input
            id="tripDate"
            type="date"
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
          />
        </div>
        <div>
          <label htmlFor="vehicle" className="block text-sm font-medium text-[#243126]">
            Vehicle (optional)
          </label>
          <input
            id="vehicle"
            type="text"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="e.g., Jeep Wrangler, Toyota 4Runner"
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
            maxLength={100}
          />
        </div>
      </div>

      {/* Story Body — MDXEditor */}
      <div>
        <label className="block text-sm font-medium text-[#243126]">
          Your story *
        </label>
        <div className="mt-2">
          <MDXEditorWrapper
            value={storyBody}
            onChange={setStoryBody}
            placeholder="Tell us about your trip — the road, the views, the challenges, the people. What made this trail memorable?"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Use the toolbar to format your story. Add links, headings, and lists.
        </p>
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-[#243126]">
          Short excerpt (optional)
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="A short summary that appears in the blog listing"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
          maxLength={500}
        />
      </div>

      {/* Safety Notes */}
      <div>
        <label htmlFor="safetyNotes" className="block text-sm font-medium text-[#243126]">
          Safety notes (optional)
        </label>
        <textarea
          id="safetyNotes"
          value={safetyNotes}
          onChange={(e) => setSafetyNotes(e.target.value)}
          rows={2}
          placeholder="Any safety tips for others considering this trail?"
          className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#2f5d3a]"
        />
      </div>

      {/* Recommended for beginners */}
      <div className="flex items-start gap-3">
        <input
          id="recommendedForBeginners"
          type="checkbox"
          checked={recommendedForBeginners}
          onChange={(e) => setRecommendedForBeginners(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2f5d3a]"
        />
        <label htmlFor="recommendedForBeginners" className="text-sm text-gray-700">
          This trail is suitable for beginners
        </label>
      </div>

      {/* Photos */}
      <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
        <h3 className="text-sm font-semibold text-[#243126]">Photos</h3>
        <p className="mt-1 text-xs text-gray-500">
          Up to {MAX_PHOTOS_PER_STORY} photos. JPG, PNG, or WebP. Max 5MB each.
        </p>

        {photos.length > 0 && (
          <div className="mt-4 space-y-3">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="flex flex-wrap items-start gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <img
                  src={photo.public_url}
                  alt={photo.alt_text || 'Uploaded photo'}
                  className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={photo.alt_text}
                    onChange={(e) => setPhotoAlt(i, e.target.value)}
                    placeholder="Alt text (optional)"
                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-[#2f5d3a]"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="radio"
                        name="coverPhoto"
                        checked={photo.is_cover}
                        onChange={() => setCoverPhoto(i)}
                        className="h-3.5 w-3.5 text-[#2f5d3a]"
                      />
                      Cover image
                    </label>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="inline-flex cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            {uploadingPhoto ? 'Uploading\u2026' : photos.length < MAX_PHOTOS_PER_STORY ? 'Upload photos' : 'Max photos reached'}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              multiple
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto || photos.length >= MAX_PHOTOS_PER_STORY}
              className="hidden"
            />
          </label>

          <div className="mt-4 flex items-start gap-3">
            <input
              id="rightsConfirmed"
              type="checkbox"
              checked={rightsConfirmed}
              onChange={(e) => setRightsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2f5d3a]"
              required
            />
            <label htmlFor="rightsConfirmed" className="text-sm leading-6 text-gray-700">
              I confirm this is my own story and I have the right to share these photos/videos.
            </label>
          </div>
        </div>
      </div>

      {/* YouTube Videos */}
      <div className="rounded-2xl border border-black/8 bg-[#f8faf8] p-5">
        <h3 className="text-sm font-semibold text-[#243126]">YouTube videos</h3>
        <p className="mt-1 text-xs text-gray-500">
          Add YouTube links from your trip (up to {MAX_YOUTUBE_PER_STORY}).
          First upload your video to YouTube, then paste the link below.
        </p>

        {youtubeLinks.length > 0 && (
          <div className="mt-4 space-y-2">
            {youtubeLinks.map((link, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#243126]">
                    {link.title || `Video ${i + 1}`}
                  </p>
                  <p className="truncate text-xs text-gray-500">{link.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeYoutubeLink(i)}
                  className="ml-3 flex-shrink-0 text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {youtubeLinks.length < MAX_YOUTUBE_PER_STORY && (
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={youtubeInput}
              onChange={(e) => setYoutubeInput(e.target.value)}
              placeholder="YouTube URL (paste link here)"
              className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2f5d3a]"
            />
            <input
              type="text"
              value={youtubeTitle}
              onChange={(e) => setYoutubeTitle(e.target.value)}
              placeholder="Title (optional)"
              className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#2f5d3a]"
            />
            <button
              type="button"
              onClick={addYoutubeLink}
              className="rounded-lg bg-[#2f5d3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264d30]"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-sm font-semibold text-amber-800">Community guidelines</h3>
        <ul className="mt-3 space-y-1 text-sm text-amber-700">
          {GUIDELINES.map((g, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5">\u00b7</span>
              {g}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => handlePublishIntent('publish')}
          className="rounded-lg bg-[#2f5d3a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#264d30]"
        >
          Preview & Publish
        </button>
        <button
          type="button"
          onClick={() => handlePublishIntent('draft')}
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Save as draft
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Click &ldquo;Preview &amp; Publish&rdquo; to review your story before going live.
        {preSelectedSlug && (
          <span className="ml-2 text-[#2f5d3a]">
            This story will be linked to a trail.
          </span>
        )}
      </p>

      <ActionToast message={toast} />
    </form>
  );
}
