"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';

type Props = {
  code: string | null;
  type: string | null;
};

export default function ResetPasswordConfirmClient({ code, type }: Props) {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'saving' | 'success'>('checking');
  const [message, setMessage] = useState('Validating your reset link...');

  useEffect(() => {
    async function validateLink() {
      const supabase = getBrowserSupabase();
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const resolvedType = hashParams.get('type') || type;

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        }

        if (resolvedType === 'recovery' && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          setStatus('ready');
          setMessage('Link verified. You can now set a new password.');
          return;
        }

        throw new Error('This reset link is invalid or expired.');
      } catch {
        setStatus('invalid');
        setMessage('This password reset link is invalid or expired. Please request a new one.');
      }
    }

    void validateLink();
  }, [code, type]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('saving');
    setMessage('Updating your password...');

    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('success');
      setMessage('Password reset successful. You can now log in with your new password.');
    } catch {
      setStatus('invalid');
      setMessage('This reset link is invalid or expired. Please request a new one.');
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f3] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5d7d61]">Reset password</p>
          <h1 className="mt-2 text-3xl font-bold text-[#243126]">Secure password reset</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600">{message}</p>
        </section>

        {status === 'ready' || status === 'saving' ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#2f5d3a]"
              />
              <button
                type="submit"
                disabled={status === 'saving'}
                className="w-full rounded-lg bg-[#2f5d3a] py-3 font-semibold text-white transition hover:bg-[#264d30] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'saving' ? 'Updating password...' : 'Set new password'}
              </button>
            </form>
          </section>
        ) : null}

        {status === 'invalid' || status === 'success' ? (
          <section className="rounded-3xl border border-black/8 bg-white p-8 shadow-sm">
            <Link href="/#member-access" className="inline-flex rounded-lg bg-[#2f5d3a] px-5 py-3 font-semibold text-white transition hover:bg-[#264d30]">
              Back to login
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}
