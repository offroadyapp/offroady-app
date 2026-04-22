import { randomBytes } from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/server';
import { buildEmailFooter, getEmailPreferencesByEmail } from '@/lib/offroady/email-preferences';
import { sendTransactionalEmail } from '@/lib/offroady/email';

type SessionIdentity = {
  id: string;
  displayName: string;
  email: string;
};

type ProposalImageInput = {
  storagePath?: string | null;
  publicUrl?: string | null;
  source?: 'member_upload' | 'fallback';
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
  caption?: string | null;
};

export type CreateTrailProposalInput = {
  title: string;
  latitude: number;
  longitude: number;
  region?: string;
  locationLabel?: string;
  notes?: string;
  routeConditionNote?: string;
  supportingLinks?: string[];
  hasVisited?: boolean;
  knowsOthersVisited?: boolean;
  coverImageUrl?: string | null;
  images?: ProposalImageInput[];
  origin?: string;
};

export type TrailProposalRecord = {
  id: string;
  proposalSlug: string;
  title: string;
  region: string | null;
  locationLabel: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  routeConditionNote: string | null;
  supportingLinks: string[];
  hasVisited: boolean;
  knowsOthersVisited: boolean;
  sourceType: string;
  status: string;
  isVisible: boolean;
  isConfirmed: boolean;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy: {
    id: string;
    displayName: string;
    email: string;
  };
  images: Array<{
    id: string;
    publicUrl: string | null;
    storagePath: string | null;
    source: string;
    width: number | null;
    height: number | null;
    byteSize: number | null;
    caption: string | null;
    sortOrder: number;
  }>;
};

type TrailProposalRow = {
  id: string;
  proposal_slug: string;
  submitted_by_user_id: string;
  title: string;
  region: string | null;
  location_label: string | null;
  latitude: number;
  longitude: number;
  notes: string | null;
  route_condition_note: string | null;
  supporting_links: string[] | null;
  has_visited: boolean;
  knows_others_visited: boolean;
  source_type: string;
  status: string;
  is_visible: boolean;
  is_confirmed: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

type TrailProposalImageRow = {
  id: string;
  proposal_id: string;
  source: string;
  storage_path: string | null;
  public_url: string | null;
  width: number | null;
  height: number | null;
  byte_size: number | null;
  caption: string | null;
  sort_order: number;
};

function ensureText(value: string, field: string, max = 160) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  if (trimmed.length > max) {
    throw new Error(`${field} is too long`);
  }
  return trimmed;
}

function ensureLatitude(value: number) {
  if (!Number.isFinite(value) || value < -90 || value > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  return value;
}

function ensureLongitude(value: number) {
  if (!Number.isFinite(value) || value < -180 || value > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }
  return value;
}

function normalizeLinks(values: string[] = []) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      try {
        const parsed = new URL(value);
        return parsed.toString();
      } catch {
        throw new Error(`Invalid supporting link: ${value}`);
      }
    })
    .slice(0, 10);
}

function slugifyProposal(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const suffix = randomBytes(3).toString('hex');
  return `${base || 'trail-proposal'}-${suffix}`;
}

function mapProposal(
  row: TrailProposalRow,
  submitter: SessionIdentity,
  images: TrailProposalImageRow[]
): TrailProposalRecord {
  return {
    id: row.id,
    proposalSlug: row.proposal_slug,
    title: row.title,
    region: row.region,
    locationLabel: row.location_label,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    routeConditionNote: row.route_condition_note,
    supportingLinks: row.supporting_links ?? [],
    hasVisited: row.has_visited,
    knowsOthersVisited: row.knows_others_visited,
    sourceType: row.source_type,
    status: row.status,
    isVisible: row.is_visible,
    isConfirmed: row.is_confirmed,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedBy: submitter,
    images: (images ?? []).map((image) => ({
      id: image.id,
      publicUrl: image.public_url,
      storagePath: image.storage_path,
      source: image.source,
      width: image.width,
      height: image.height,
      byteSize: image.byte_size,
      caption: image.caption,
      sortOrder: image.sort_order,
    })),
  };
}

export async function createTrailProposal(submitter: SessionIdentity, input: CreateTrailProposalInput) {
  const supabase = getServiceSupabase();
  const title = ensureText(input.title, 'Trail title', 120);
  const latitude = ensureLatitude(input.latitude);
  const longitude = ensureLongitude(input.longitude);
  const region = input.region?.trim() || null;
  const locationLabel = input.locationLabel?.trim() || null;
  const notes = input.notes?.trim() || null;
  const routeConditionNote = input.routeConditionNote?.trim() || null;
  const supportingLinks = normalizeLinks(input.supportingLinks);
  const images = (input.images ?? []).slice(0, 5);
  const proposalSlug = slugifyProposal(title);
  const coverImageUrl = input.coverImageUrl?.trim() || images[0]?.publicUrl?.trim() || null;

  const { data: proposal, error: proposalError } = await supabase
    .from('trail_proposals')
    .insert({
      proposal_slug: proposalSlug,
      submitted_by_user_id: submitter.id,
      title,
      region,
      location_label: locationLabel,
      latitude,
      longitude,
      notes,
      route_condition_note: routeConditionNote,
      supporting_links: supportingLinks,
      has_visited: Boolean(input.hasVisited),
      knows_others_visited: Boolean(input.knowsOthersVisited),
      source_type: 'user_proposal',
      status: 'proposed',
      is_visible: true,
      is_confirmed: false,
      cover_image_url: coverImageUrl,
    })
    .select('*')
    .single();

  if (proposalError) throw proposalError;

  let insertedImages: TrailProposalImageRow[] = [];
  if (images.length) {
    const { data, error } = await supabase
      .from('trail_proposal_images')
      .insert(
        images.map((image, index) => ({
          proposal_id: proposal.id,
          source: image.source ?? 'member_upload',
          storage_path: image.storagePath?.trim() || null,
          public_url: image.publicUrl?.trim() || null,
          width: image.width ?? null,
          height: image.height ?? null,
          byte_size: image.byteSize ?? null,
          caption: image.caption?.trim() || null,
          sort_order: index,
        }))
      )
      .select('*');

    if (error) throw error;
    insertedImages = data ?? [];
  }

  const preferences = await getEmailPreferencesByEmail(submitter.email, submitter.id).catch(() => null);
  if (preferences?.weeklyTrailUpdates) {
    const proposalUrl = input.origin ? `${input.origin}/trail-proposals/${proposalSlug}` : `/trail-proposals/${proposalSlug}`;
    const footer = await buildEmailFooter(submitter.email, 'weeklyTrailUpdates', input.origin);
    await sendTransactionalEmail({
      to: submitter.email,
      subject: `Trail proposed: ${title}`,
      text: `Your trail proposal for ${title} is live. Review it here: ${proposalUrl}${footer}`,
    });
  }

  return mapProposal(proposal, submitter, insertedImages);
}

export async function getTrailProposalBySlug(slug: string) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  const supabase = getServiceSupabase();
  const { data: proposal, error: proposalError } = await supabase
    .from('trail_proposals')
    .select('*')
    .eq('proposal_slug', normalizedSlug)
    .maybeSingle();

  if (proposalError) throw proposalError;
  if (!proposal) return null;

  const { data: submitter, error: submitterError } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('id', proposal.submitted_by_user_id)
    .maybeSingle();

  if (submitterError) throw submitterError;
  if (!submitter) return null;

  const { data: images, error: imagesError } = await supabase
    .from('trail_proposal_images')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('sort_order', { ascending: true });

  if (imagesError) throw imagesError;

  return mapProposal(
    proposal,
    {
      id: submitter.id,
      displayName: submitter.display_name,
      email: submitter.email,
    },
    images ?? []
  );
}
