This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Offroady Local Runtime

Use the standardized local runtime scripts instead of ad-hoc `next dev` / `next start` commands.

### Fixed local convention

- Host: `127.0.0.1`
- Port: `3000`
- Env source: `.env.local`
- Cleanup rule: kill stale **Offroady-only** Next/node runtimes before starting a new one

### Commands

```bash
npm run local:status
npm run local:clean
npm run local:dev
npm run local:start
```

### What they do

- `npm run local:status` shows the current Offroady runtime and port listener state
- `npm run local:clean` stops stale Offroady local runtimes and frees port `3000`
- `npm run local:dev` cleans first, then starts a single dev runtime on `http://127.0.0.1:3000`
- `npm run local:start` cleans first, rebuilds, then starts a single production-style runtime on `http://127.0.0.1:3000`

If you need a different host or port temporarily, you can override them.

PowerShell:

```powershell
$env:OFFROADY_PORT = '3001'
npm run local:start
```

bash/zsh:

```bash
OFFROADY_PORT=3001 npm run local:start
```

You can start editing the page by modifying `app/page.tsx`. The dev runtime will auto-update.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
