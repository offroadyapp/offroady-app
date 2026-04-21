"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from './ConfirmModal';
import ActionToast from './ActionToast';

type Props = {
  label: string;
  confirmTitle: string;
  confirmBody: string;
  apiPath: string;
  successMessage?: string;
  onSuccess?: (payload: unknown) => void;
  refreshOnSuccess?: boolean;
  className?: string;
};

export default function LeaveActionButton({ label, confirmTitle, confirmBody, apiPath, successMessage, onSuccess, refreshOnSuccess = true, className = 'rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function confirmLeave() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(apiPath, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to ${label.toLowerCase()}`);
      setOpen(false);
      setToast(successMessage || `${label} updated.`);
      onSuccess?.(payload);
      if (refreshOnSuccess) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${label.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <button type="button" onClick={() => setOpen(true)} className={className}>
          {label}
        </button>
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
      </div>
      <ConfirmModal
        open={open}
        title={confirmTitle}
        body={confirmBody}
        confirmLabel={label}
        loadingLabel={`${label}...`}
        busy={loading}
        onCancel={() => !loading && setOpen(false)}
        onConfirm={confirmLeave}
      />
      <ActionToast message={toast} />
    </>
  );
}
