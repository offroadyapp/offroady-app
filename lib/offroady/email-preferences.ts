import { randomBytes } from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/server';

export type EmailPreferenceCategory =
  | 'weeklyTrailUpdates'
  | 'tripNotifications'
  | 'tripJoinPlannerEmail'
  | 'tripJoinParticipantEmail'
  | 'crewNotifications'
  | 'commentReplyNotifications'
  | 'marketingPromotionalEmails';

export type EmailPreferences = {
  email: string;
  weeklyTrailUpdates: boolean;
  tripNotifications: boolean;
  tripJoinPlannerEmail: boolean;
  tripJoinParticipantEmail: boolean;
  crewNotifications: boolean;
  commentReplyNotifications: boolean;
  marketingPromotionalEmails: boolean;
};

const defaultPreferences: Omit<EmailPreferences, 'email'> = {
  weeklyTrailUpdates: true,
  tripNotifications: true,
  tripJoinPlannerEmail: true,
  tripJoinParticipantEmail: true,
  crewNotifications: true,
  commentReplyNotifications: true,
  marketingPromotionalEmails: true,
};

const fieldMap: Record<EmailPreferenceCategory, keyof typeof defaultPreferences> = {
  weeklyTrailUpdates: 'weeklyTrailUpdates',
  tripNotifications: 'tripNotifications',
  tripJoinPlannerEmail: 'tripJoinPlannerEmail',
  tripJoinParticipantEmail: 'tripJoinParticipantEmail',
  crewNotifications: 'crewNotifications',
  commentReplyNotifications: 'commentReplyNotifications',
  marketingPromotionalEmails: 'marketingPromotionalEmails',
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type EmailPreferencesRow = {
  weekly_trail_updates?: boolean | null;
  trip_notifications?: boolean | null;
  trip_join_planner_email?: boolean | null;
  trip_join_participant_email?: boolean | null;
  crew_notifications?: boolean | null;
  comment_reply_notifications?: boolean | null;
  marketing_promotional_emails?: boolean | null;
};

function mapRow(row: EmailPreferencesRow | null | undefined, email: string): EmailPreferences {
  return {
    email,
    weeklyTrailUpdates: row?.weekly_trail_updates ?? true,
    tripNotifications: row?.trip_notifications ?? true,
    tripJoinPlannerEmail: row?.trip_join_planner_email ?? true,
    tripJoinParticipantEmail: row?.trip_join_participant_email ?? true,
    crewNotifications: row?.crew_notifications ?? true,
    commentReplyNotifications: row?.comment_reply_notifications ?? true,
    marketingPromotionalEmails: row?.marketing_promotional_emails ?? true,
  };
}

function toRowPatch(input: Partial<Omit<EmailPreferences, 'email'>>) {
  const patch: Record<string, boolean> = {};
  if (typeof input.weeklyTrailUpdates === 'boolean') patch.weekly_trail_updates = input.weeklyTrailUpdates;
  if (typeof input.tripNotifications === 'boolean') patch.trip_notifications = input.tripNotifications;
  if (typeof input.tripJoinPlannerEmail === 'boolean') patch.trip_join_planner_email = input.tripJoinPlannerEmail;
  if (typeof input.tripJoinParticipantEmail === 'boolean') patch.trip_join_participant_email = input.tripJoinParticipantEmail;
  if (typeof input.crewNotifications === 'boolean') patch.crew_notifications = input.crewNotifications;
  if (typeof input.commentReplyNotifications === 'boolean') patch.comment_reply_notifications = input.commentReplyNotifications;
  if (typeof input.marketingPromotionalEmails === 'boolean') patch.marketing_promotional_emails = input.marketingPromotionalEmails;
  return patch;
}

async function getOrCreateEmailPreferencesRow(email: string, userId?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('*')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { error: upsertError } = await supabase.from('user_email_preferences').upsert({
      email: normalizedEmail,
      user_id: userId ?? null,
    });
    if (upsertError) throw upsertError;
    return {
      email: normalizedEmail,
      row: null,
      created: true,
    };
  }

  if (userId && data.user_id !== userId) {
    const { error: updateError } = await supabase.from('user_email_preferences').update({ user_id: userId }).eq('email', normalizedEmail);
    if (updateError) throw updateError;
  }

  return {
    email: normalizedEmail,
    row: data,
    created: false,
  };
}

export async function getEmailPreferencesByEmail(email: string, userId?: string | null) {
  const result = await getOrCreateEmailPreferencesRow(email, userId);
  return result.created
    ? ({ email: result.email, ...defaultPreferences } satisfies EmailPreferences)
    : mapRow(result.row, result.email);
}

export async function ensureEmailPreferencesForUser(email: string, userId?: string | null) {
  return getEmailPreferencesByEmail(email, userId);
}

export async function subscribeToWeeklyDigest(email: string, userId?: string | null) {
  const current = await getOrCreateEmailPreferencesRow(email, userId);
  const currentPreferences = current.created
    ? ({ email: current.email, ...defaultPreferences } satisfies EmailPreferences)
    : mapRow(current.row, current.email);

  if (!current.created && currentPreferences.weeklyTrailUpdates && (!userId || currentPreferences.email === normalizeEmail(email))) {
    return {
      preferences: currentPreferences,
      alreadySubscribed: true,
    };
  }

  const preferences = await updateEmailPreferencesByEmail(
    email,
    { weeklyTrailUpdates: true },
    userId ?? null
  );

  return {
    preferences,
    alreadySubscribed: false,
  };
}

export async function listWeeklyDigestSubscribers() {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('user_email_preferences')
    .select('email, user_id, weekly_trail_updates')
    .eq('weekly_trail_updates', true)
    .order('email', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    email: normalizeEmail(String(row.email ?? '')),
    userId: typeof row.user_id === 'string' ? row.user_id : null,
  })).filter((row) => row.email);
}

export async function updateEmailPreferencesByEmail(email: string, patch: Partial<Omit<EmailPreferences, 'email'>>, userId?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const payload = {
    email: normalizedEmail,
    user_id: userId ?? null,
    ...toRowPatch(patch),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('user_email_preferences').upsert(payload, { onConflict: 'email' });
  if (error) throw error;

  return getEmailPreferencesByEmail(normalizedEmail, userId);
}

export async function createEmailPreferenceToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const supabase = getServiceSupabase();
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString();

  const { error } = await supabase.from('email_preference_tokens').insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return token;
}

export async function getEmailPreferencesByToken(token: string) {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new Error('Token is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('email_preference_tokens')
    .select('email, expires_at')
    .eq('token', normalizedToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Invalid unsubscribe link');
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This unsubscribe link has expired');
  }

  await supabase.from('email_preference_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', normalizedToken);
  return getEmailPreferencesByEmail(data.email);
}

export async function updateEmailPreferencesByToken(token: string, patch: Partial<Omit<EmailPreferences, 'email'>>) {
  const normalizedToken = token.trim();
  if (!normalizedToken) throw new Error('Token is required');

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('email_preference_tokens')
    .select('email, expires_at')
    .eq('token', normalizedToken)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Invalid unsubscribe link');
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    throw new Error('This unsubscribe link has expired');
  }

  await supabase.from('email_preference_tokens').update({ last_used_at: new Date().toISOString() }).eq('token', normalizedToken);
  return updateEmailPreferencesByEmail(data.email, patch);
}

export async function unsubscribeCategoryByToken(token: string, category: EmailPreferenceCategory) {
  const field = fieldMap[category];
  return updateEmailPreferencesByToken(token, { [field]: false });
}

export async function buildEmailPreferenceLinks(email: string, origin?: string) {
  const token = await createEmailPreferenceToken(email);
  const root = origin || '';
  return {
    unsubscribeUrl: `${root}/unsubscribe/${token}`,
    preferencesUrl: `${root}/email-preferences?token=${token}`,
    token,
  };
}

export async function buildEmailFooter(email: string, category: EmailPreferenceCategory, origin?: string) {
  const links = await buildEmailPreferenceLinks(email, origin);
  const unsubscribeUrl = `${links.unsubscribeUrl}?category=${encodeURIComponent(category)}`;
  return `\n\nUnsubscribe: ${unsubscribeUrl}\nManage Email Preferences: ${links.preferencesUrl}`;
}
