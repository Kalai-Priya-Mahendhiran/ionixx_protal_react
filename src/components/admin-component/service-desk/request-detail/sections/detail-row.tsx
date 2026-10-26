import type { ReactNode } from 'react';

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="min-w-0 text-gray-900">{children}</div>
    </div>
  );
}
