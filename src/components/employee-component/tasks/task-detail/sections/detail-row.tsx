import type { ReactNode } from 'react';

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 py-2.5 text-sm">
      <dt className="pt-0.5 text-gray-500">{label}</dt>
      <dd className="min-w-0 text-gray-800">{children}</dd>
    </div>
  );
}
