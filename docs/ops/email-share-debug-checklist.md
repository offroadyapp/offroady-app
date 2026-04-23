# Offroady Email Share Debug Checklist

Use this when trail/trip share email behaves differently between localhost and production.

## Common symptoms

- localhost succeeds, production fails
- UI shows `Email sharing is temporarily unavailable. Please try again later.`
- UI shows login / sign-up prompt instead of sending
- share request returns `503`
- response header `x-offroady-share-branch=provider-unavailable`
- response header `x-offroady-share-reason=missing-email-provider-config`

## First checks (30 seconds)

Open the failing share request in the browser network panel and record these response headers:

- `x-offroady-runtime-build`
- `x-offroady-runtime-env`
- `x-offroady-runtime-node-env`
- `x-offroady-share-branch`
- `x-offroady-share-reason`
- `x-offroady-share-missing-config`
- `x-offroady-share-message-id`
- `x-offroady-share-accepted`
- `x-offroady-share-from`

If those headers are missing, the production site is likely still on an older build.

## Production env: required variables

Check the deployment platform production environment for:

- `RESEND_API_KEY`
- `OFFROADY_FROM_EMAIL`
- `EMAIL_FROM` (recommended fallback)

After changing any of them, **redeploy Production**.

## Quick diagnosis logic

- `401` / `403` or members-only UI prompt -> auth / permission issue
- `503` + `x-offroady-share-reason=missing-email-provider-config` -> production env is missing mail config
- `503` + `provider-unavailable` without missing config -> provider/system issue, inspect sender/domain/provider response
- `200` + `x-offroady-share-branch=sent` -> share flow is healthy
- `sent` + message id/accepted/from headers present -> provider accepted the send
- headers missing or build id unexpected -> old build / old deployment still serving traffic

## Fix verification steps

After a fix or redeploy, re-test all of these on the real production site:

1. Logged-in trail share
2. Logged-in trip share
3. Logged-out trail/trip share shows login / sign-up prompt and does not send
4. Network response headers show the expected build and branch
5. Provider evidence exists when successful:
   - `x-offroady-share-message-id`
   - `x-offroady-share-accepted=true`
   - `x-offroady-share-from`

## Real example

### Broken production state
- build: `JaJshiWenXAtTnr58zBy3`
- branch: `provider-unavailable`
- reason: `missing-email-provider-config`
- missing config: `RESEND_API_KEY, OFFROADY_FROM_EMAIL|EMAIL_FROM`

### Fixed production state
- build: `FI8EWmqLIbxyBGhczpsZc`
- branch: `sent`
- trail message id: `eca9ede4-941f-4248-9fe4-86246eb63d15`
- trip message id: `fc9de79a-6cc5-42c7-9ac5-9919ded0136e`
- from: `Offroady <noreply@notify.offroady.app>`
