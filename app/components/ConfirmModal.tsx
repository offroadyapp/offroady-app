"use client";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  loadingLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({ open, title, body, confirmLabel, loadingLabel, busy = false, onCancel, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-[#243126]">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-[#9f2d2d] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#862626] disabled:opacity-70"
          >
            {busy ? (loadingLabel || confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
