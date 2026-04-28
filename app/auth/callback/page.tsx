import { Suspense } from 'react';
import { sanitizeAuthRedirectPath } from '@/lib/offroady/oauth';
import OAuthCallbackClient from './OAuthCallbackClient';

export default async function OAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    next?: string;
    type?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f6f3] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Member access</p><h1 className="mt-2 text-3xl font-bold text-[#243126]">Connecting your account</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Finishing your sign-in...</p></div></main>}>
      <OAuthCallbackClient
        code={params.code ?? null}
        error={params.error ?? null}
        errorDescription={params.error_description ?? null}
        next={sanitizeAuthRedirectPath(params.next)}
        type={params.type ?? null}
      />
    </Suspense>
  );
}
