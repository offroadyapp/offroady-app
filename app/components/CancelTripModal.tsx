"use client";

import { useState } from 'react';

type Props = {
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export default function CancelTripModal({ open, busy, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#243126]">Cancel this trip?</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          This will cancel the trip for everyone. All joined members will be notified and their membership status will be set to cancelled.
        </p>

        <div className="mt-4">
          <label htmlFor="cancel-reason" className="block text-sm font-semibold text-gray-700">
            Reason for cancellation <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Weather looks bad, not enough vehicles, trail closed..."
            rows={3}
            maxLength={500}
            className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 transition focus:border-[#2f5d3a] focus:outline-none focus:ring-2 focus:ring-[#2f5d3a]/20 disabled:opacity-70"
            disabled={busy}
          />
          <p className="mt-1 text-xs text-gray-400">{reason.length}/500</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
          >
            Keep Trip
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason)}
            disabled={busy}
            className="rounded-lg bg-[#9f2d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#862626] disabled:opacity-70"
          >
            {busy ? 'Cancelling...' : 'Cancel Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
