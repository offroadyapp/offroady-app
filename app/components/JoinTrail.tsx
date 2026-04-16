"use client";

import { useState } from 'react';

export default function JoinTrail({ onJoin }: { onJoin: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg bg-[#2f5d3a] px-4 py-2 font-semibold text-white hover:bg-[#264d30]"
      >
        Join this trail
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold">Join trail</h3>
            <input
              placeholder="Display name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mb-3 w-full rounded border px-3 py-2"
            />
            <button
              onClick={() => {
                const trimmed = name.trim();
                if (!trimmed) return;
                onJoin(trimmed);
                setOpen(false);
                setName('');
              }}
              className="w-full rounded bg-[#2f5d3a] py-2 text-white"
            >
              Confirm
            </button>
            <button onClick={() => setOpen(false)} className="mt-2 w-full text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
