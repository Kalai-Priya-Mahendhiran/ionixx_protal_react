import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/*
 * The one stat card for every screen (the Tasks stat card style): coloured icon tile, label, big number.
 * Every card is exactly two lines tall, so cards line up across pages; extra info goes in `hint`,
 * shown small beside the number (e.g. "+2%", "of 12 days", "Past due").
 *
 *   <StatGrid>
 *     <StatCard icon={Users2} label="Total" value={15} tone="indigo" />
 *     <StatCard icon={UserX} label="Overdue" value={1} tone="red" hint="Past due" active={filter === 'overdue'} onClick={…} />
 *   </StatGrid>
 */

export type StatTone = 'indigo' | 'blue' | 'sky' | 'teal' | 'green' | 'amber' | 'orange' | 'red' | 'pink' | 'purple' | 'gray';

export const STAT_TONE_CLASS: Record<StatTone, string> = {
  indigo: 'bg-indigo-100 text-indigo-600',
  blue: 'bg-blue-100 text-blue-600',
  sky: 'bg-sky-100 text-sky-600',
  teal: 'bg-teal-100 text-teal-600',
  green: 'bg-green-100 text-green-600',
  amber: 'bg-amber-100 text-amber-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  pink: 'bg-pink-100 text-pink-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  tone?: StatTone;
  // Overrides the tone, e.g. a workflow status colour ("bg-blue-100 text-blue-700")
  iconClassName?: string;
  // Small text beside the number
  hint?: ReactNode;
  loading?: boolean;
  // Clickable cards act as filters; `active` shows the selected ring
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, tone = 'indigo', iconClassName, hint, loading = false, onClick, active, className }: StatCardProps) {
  const body = (
    <Card data-stat-card className={cn('h-full transition-all', onClick && 'hover:shadow-md', active && 'shadow-md ring-2 ring-[#464EB8]', className)}>
      <CardContent className="flex h-full items-center gap-3 p-4">
        <div className={cn('shrink-0 rounded-lg p-2', iconClassName ?? STAT_TONE_CLASS[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-600" title={label}>
            {label}
          </p>
          {loading ? (
            <div className="mt-1 h-7 w-10 animate-pulse rounded bg-gray-200" />
          ) : (
            <p className="flex min-w-0 items-baseline gap-2">
              {/* The number never wraps (e.g. "1d 1h"); the hint shortens instead, so every card stays two lines */}
              <span className="whitespace-nowrap text-2xl font-bold tabular-nums text-gray-900">{value}</span>
              {hint && <span className="min-w-0 truncate text-xs font-medium text-gray-500">{hint}</span>}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
  if (!onClick) return <div className="h-full">{body}</div>;
  return (
    <button type="button" onClick={onClick} aria-pressed={active ?? undefined} className="h-full rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/50">
      {body}
    </button>
  );
}

// Responsive row of stat cards: two per row on phones, then as many as fit (at least 170px each)
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]', className)}>{children}</div>;
}
