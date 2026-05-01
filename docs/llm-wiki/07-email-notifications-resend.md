# Email Notifications & Resend

## Resend Sender / Domain Setup

Offroady uses **Resend** for transactional emails.

**Sender:** `Offroady <noreply@notify.offroady.app>`

**Configuration (in `.env.local` or Vercel env vars):**
```env
RESEND_API_KEY=re_xxx
OFFROADY_FROM_EMAIL=Offroady <noreply@notify.offroady.app>
```

**Fallback** (alternative env var name): `EMAIL_FROM`

**Resend API endpoint:** `POST https://api.resend.com/emails`

## Types of Emails Sent

Offroady sends these transactional emails:

| Email Type | Trigger | Rate Limited? |
|------------|---------|---------------|
| Share trail (by email) | User clicks "Share by Email" on trail detail | Yes |
| Share trip (by email) | User clicks "Share by Email" on trip detail | Yes |
| Trip join notification | Someone joins your trip | No by design |
| Weekly digest | Published digest sent to all subscribers | N/A (bulk) |
| Forgot password | User requests password reset | Per Resend limits |
| Trip invites | Member invites another member | Per Resend limits |

## Email Preference Rules

Email preferences are stored in `user_email_preferences`:

| Preference | Default | Controls |
|------------|---------|----------|
| `weekly_trail_updates` | true | Weekly digest |
| `trip_notifications` | true | Trip-related notifications |
| `trip_join_planner_email` | true | Email to planner when someone joins their trip |
| `trip_join_participant_email` | true | Confirmation email to joiner |
| `crew_notifications` | true | Crew updates |
| `comment_reply_notifications` | true | Comment reply notices |
| `marketing_promotional_emails` | true | Promotional emails |

**Rules:**
- Preferences are auto-created on account creation and on every login
- Toggled from `/my-account/email-preferences` (logged in) or `/email-preferences?token=xxx` (token-based)
- Preferences are per-email (primary key is `email`), not per-user
- A `user_id` is linked when the user has an account

## Unsubscribe Expectations

Every transactional email should include an unsubscribe link.

**Unsubscribe methods:**
1. One-click link in email → `/unsubscribe?token=xxx`
2. Email preferences page → `/email-preferences?token=xxx`
3. Logged-in: `/my-account/email-preferences`

**Token system:**
- `email_preference_tokens` table stores tokens per email
- Tokens are one-time or reusable (exact behavior needs verification — check `lib/offroady/email-preferences.ts`)
- Tokens have an optional `expires_at` field
- `email_preference_tokens` has NO RLS policies — service-role only

## Known Resend Rate Limit Issue

Resend applies rate limits on its free/paid plans. When the send fails:

- API route returns `503` with response header `x-offroady-share-branch=provider-unavailable`
- User sees: "Email sharing is temporarily unavailable. Please try again later."

**Mitigation:** None currently implemented. If this becomes frequent, consider:
- Adding a queue/delay for sends
- Caching the "unavailable" state to avoid hitting Resend on every request
- Upgrading Resend plan

**Debug via response headers:**

Check `x-offroady-*` headers in the network panel:
- `x-offroady-share-branch`: `sent` | `provider-unavailable`
- `x-offroady-share-reason`: human-readable reason
- `x-offroady-share-missing-config`: which env vars are missing
- `x-offroady-share-message-id`: Resend message ID on success
- `x-offroady-share-accepted`: `true` on success
- `x-offroady-share-from`: sender address

Full debug checklist at `docs/ops/email-share-debug-checklist.md`.

## Email Sender Architecture

```typescript
// lib/offroady/email.ts
sendTransactionalEmail({
  to: 'user@example.com',
  subject: 'Subject',
  text: 'Plain text version',
  html: '<p>HTML version</p>'
})
```

The function:
1. Reads config from env vars
2. If missing → returns `{ ok: false, skipped: true, reason: 'missing-email-provider-config' }`
3. Sends via `POST https://api.resend.com/emails`
4. Returns result with `ok`, `messageId`, `status`, and provider metadata

## Email Wording

The email share content pulls real trail/trip data:
- Trail name, region, difficulty, description
- Trip date, meetup area, planner name
- CTA link back to the trail/trip on Offroady

Sender/domain stays consistent: `Offroady <noreply@notify.offroady.app>`
