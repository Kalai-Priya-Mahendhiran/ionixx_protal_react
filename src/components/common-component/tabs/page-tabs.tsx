import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * The one tab row used across the app (Pay & Tax, Organization, Tasks, Approvals, Profile…), so every
 * page's tabs look and behave the same. Underlined active tab, optional icon and count, scrolls sideways
 * on narrow screens without showing a scrollbar. Small option toggles inside a card are a different
 * control and don't use this.
 */

export interface PageTab<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  // Shown as a pill after the label; `alert` draws attention (e.g. items waiting on you)
  count?: number;
  countTone?: 'neutral' | 'alert';
}

interface PageTabsProps<T extends string> {
  tabs: PageTab<T>[];
  value: T;
  onChange: (id: T) => void;
  // Read out by screen readers, e.g. "Pay and tax"
  label: string;
  className?: string;
}

export function PageTabs<T extends string>({ tabs, value, onChange, label, className }: PageTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {tabs.map(({ id, label: tabLabel, icon: Icon, count, countTone = 'neutral' }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active ? 'border-[#464EB8] text-[#464EB8]' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {tabLabel}
            {count !== undefined && (countTone === 'neutral' || count > 0) && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  countTone === 'alert' ? 'bg-amber-500 font-semibold text-white' : active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600',
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
