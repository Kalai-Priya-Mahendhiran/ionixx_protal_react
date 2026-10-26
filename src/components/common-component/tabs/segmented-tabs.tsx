import { cn } from '@/lib/utils';

/*
 * The small pill toggle used inside a card or sheet (Activity, Checklists, Quarter, Reply type…), so every
 * in-card switch looks and behaves the same. Page-level tabs use PageTabs instead.
 */

export interface SegmentedTab<T extends string> {
  id: T;
  label: string;
  // Shown in brackets after the label
  count?: number;
}

interface SegmentedTabsProps<T extends string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (id: T) => void;
  // Read out by screen readers, e.g. "Quarter"
  label: string;
  className?: string;
}

export function SegmentedTabs<T extends string>({ tabs, value, onChange, label, className }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5', className)}>
      {tabs.map(({ id, label: tabLabel, count }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-white text-[#464EB8] shadow-sm ring-1 ring-[#464EB8]/30' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {tabLabel}
            {count !== undefined && <span className="ml-1 text-xs text-gray-500">({count})</span>}
          </button>
        );
      })}
    </div>
  );
}
