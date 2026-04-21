"use client";

type Props = {
  message: string;
};

export default function ActionToast({ message }: Props) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 rounded-2xl bg-[#243126] px-4 py-3 text-sm font-medium text-white shadow-xl">
      {message}
    </div>
  );
}
