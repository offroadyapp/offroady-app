import { getServiceSupabase } from '@/lib/supabase/server';

const MEMBER_MEDIA_BUCKET = 'member-media';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function assertImageFile(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
}

function fileExtensionFor(file: File) {
  switch (file.type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

async function ensureBucket() {
  const supabase = getServiceSupabase();
  const { error } = await supabase.storage.createBucket(MEMBER_MEDIA_BUCKET, { public: true });
  if (!error) return;

  const message = error.message.toLowerCase();
  if (message.includes('already exists') || message.includes('duplicate')) return;
  throw error;
}

function extractManagedPath(url: string | null | undefined) {
  if (!url) return null;

  const publicMarker = `/storage/v1/object/public/${MEMBER_MEDIA_BUCKET}/`;
  const publicIndex = url.indexOf(publicMarker);
  if (publicIndex >= 0) {
    return decodeURIComponent(url.slice(publicIndex + publicMarker.length));
  }

  const signMarker = `/storage/v1/object/sign/${MEMBER_MEDIA_BUCKET}/`;
  const signIndex = url.indexOf(signMarker);
  if (signIndex >= 0) {
    const tail = url.slice(signIndex + signMarker.length);
    return decodeURIComponent(tail.split('?')[0] || '');
  }

  return null;
}

export async function uploadMemberProfileImage(userId: string, kind: 'avatar' | 'rig', file: File) {
  assertImageFile(file);
  await ensureBucket();

  const supabase = getServiceSupabase();
  const mediaColumn = kind === 'avatar' ? 'avatar_image' : 'rig_photo';

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('avatar_image, rig_photo')
    .eq('id', userId)
    .single();

  if (existingError) throw existingError;

  const extension = fileExtensionFor(file);
  const objectPath = `${userId}/${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(MEMBER_MEDIA_BUCKET)
    .upload(objectPath, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from(MEMBER_MEDIA_BUCKET).getPublicUrl(objectPath);
  const nextUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from('users')
    .update({
      [mediaColumn]: nextUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (updateError) throw updateError;

  const oldUrl = kind === 'avatar' ? existing.avatar_image : existing.rig_photo;
  const oldPath = extractManagedPath(oldUrl);
  if (oldPath && oldPath !== objectPath) {
    await supabase.storage.from(MEMBER_MEDIA_BUCKET).remove([oldPath]);
  }

  return { imageUrl: nextUrl, objectPath, bucket: MEMBER_MEDIA_BUCKET };
}
