'use client';

import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';

/**
 * Inner editor component — fully dynamic-imported for client-only usage.
 * Contains MDXEditor + toolbar in one module to avoid plugin registration issues.
 */
const EditorInner = dynamic(
  () => import('./MDXEditorImpl'),
  { ssr: false, loading: () => null }
);

type MDXEditorWrapperProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/**
 * Wraps MDXEditor with Next.js dynamic import (ssr: false).
 * Safe to use inside any client component.
 * Falls back to a plain textarea during SSR / loading.
 */
function subscribeToMount(callback: () => void) {
  // Trigger once on first subscribe (client-side mount)
  callback();
  return () => {}; // no cleanup needed
}

function getMountedSnapshot() {
  return typeof window !== 'undefined';
}

function getMountedServerSnapshot() {
  return false;
}

export default function MDXEditorWrapper({
  value,
  onChange,
  placeholder = 'Start writing your story...',
}: MDXEditorWrapperProps) {
  const isMounted = useSyncExternalStore(subscribeToMount, getMountedSnapshot, getMountedServerSnapshot);

  if (!isMounted) {
    return (
      <div className="w-full min-h-[300px] rounded-xl border border-gray-300 bg-gray-50">
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-400">Loading editor...</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] resize-y border-0 bg-white px-4 py-3 text-sm outline-none"
          readOnly
        />
      </div>
    );
  }

  return <EditorInner value={value} onChange={onChange} placeholder={placeholder} />;
}
