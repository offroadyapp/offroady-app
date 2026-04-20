import { Suspense } from 'react';
import ResetPasswordConfirmClient from './ResetPasswordConfirmClient';

export default async function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; type?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f4f6f3] px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl rounded-3xl border border-black/8 bg-white p-8 shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Reset password</p><h1 className="mt-2 text-3xl font-bold text-[#243126]">Secure password reset</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">Validating your reset link...</p></div></main>}>
      <ResetPasswordConfirmClient code={params.code ?? null} type={params.type ?? null} />
    </Suspense>
  );
}
