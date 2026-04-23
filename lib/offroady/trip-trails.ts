import { getServiceSupabase } from '@/lib/supabase/server';
import { getLocalTrailBySlug } from '@/lib/offroady/trails';

type DbTrailRef = {
  slug: string;
  title: string;
};

export type ResolvedTripTrailReference = {
  title: string;
  slug: string | null;
  href: string | null;
  source: 'local-trail' | 'published-trail' | 'stored-fallback';
};

export async function resolveTripTrailReference(input: {
  trailId?: string | null;
  trailSlug?: string | null;
  storedTitle?: string | null;
}): Promise<ResolvedTripTrailReference> {
  const trailSlug = input.trailSlug?.trim() || null;
  const localTrail = trailSlug ? getLocalTrailBySlug(trailSlug) : null;
  if (localTrail) {
    return {
      title: localTrail.title,
      slug: localTrail.slug,
      href: `/plan/${localTrail.slug}`,
      source: 'local-trail',
    };
  }

  const supabase = getServiceSupabase();
  let publishedTrail: DbTrailRef | null = null;

  if (input.trailId) {
    const { data, error } = await supabase.from('trails').select('slug, title').eq('id', input.trailId).maybeSingle();
    if (error) throw error;
    publishedTrail = (data as DbTrailRef | null) ?? null;
  }

  if (!publishedTrail && trailSlug) {
    const { data, error } = await supabase.from('trails').select('slug, title').eq('slug', trailSlug).maybeSingle();
    if (error) throw error;
    publishedTrail = (data as DbTrailRef | null) ?? null;
  }

  if (publishedTrail) {
    const localTrailForHref = getLocalTrailBySlug(publishedTrail.slug);
    return {
      title: publishedTrail.title,
      slug: publishedTrail.slug,
      href: localTrailForHref ? `/plan/${publishedTrail.slug}` : null,
      source: 'published-trail',
    };
  }

  console.warn('[resolveTripTrailReference] Unable to resolve canonical trail reference', {
    trailId: input.trailId ?? null,
    trailSlug,
    storedTitle: input.storedTitle ?? null,
  });

  return {
    title: input.storedTitle?.trim() || 'Trail unavailable',
    slug: trailSlug,
    href: null,
    source: 'stored-fallback',
  };
}
