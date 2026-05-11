import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/offroady/auth';
import {
  getStorageSupabase,
  getStorageBucket,
} from '@/lib/offroady/stories-server';
import { validatePhotoFile, ALLOWED_PHOTO_TYPES } from '@/lib/offroady/stories';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const viewer = await getSessionUser();
    if (!viewer) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const storyId = formData.get('storyId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!storyId) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    // Validate file
    const fileInfo = { type: file.type, size: file.size, name: file.name };
    const validationError = validatePhotoFile(fileInfo);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed' }, { status: 400 });
    }

    // Check story ownership
    const { getServiceSupabase } = await import('@/lib/supabase/server');
    const supabase = getServiceSupabase();
    const { data: story } = await supabase
      .from('user_stories')
      .select('id, user_id')
      .eq('id', storyId)
      .single();

    if (!story || story.user_id !== viewer.id) {
      return NextResponse.json({ error: 'Story not found or not owned by you' }, { status: 403 });
    }

    // Upload to Supabase Storage
    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `${viewer.id}/${storyId}/${timestamp}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorageSupabase();

    const { error: uploadError } = await storage.storage
      .from(getStorageBucket())
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = storage.storage
      .from(getStorageBucket())
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl ?? '';

    return NextResponse.json({
      storage_path: storagePath,
      public_url: publicUrl,
      byte_size: buffer.length,
      mime_type: file.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload photo';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
