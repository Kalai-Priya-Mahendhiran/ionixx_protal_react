import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QUICK_FILTERS, isQuickFilterActive, toggleQuickFilter, type FilterState, type QuickFilterId } from './task-utils';

interface QuickFiltersProps {
  state: FilterState;
  userId: string;
  onChange: (state: FilterState) => void;
  // e.g. "My open" is redundant on My Tasks
  hidden?: QuickFilterId[];
}

// One row of one-click presets; each chip turns its filters on or off
export function QuickFilters({ state, userId, onChange, hidden = [] }: QuickFiltersProps) {
  return (
    <div role="group" aria-label="Quick filters" className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">Quick:</span>
      {QUICK_FILTERS.filter((chip) => !hidden.includes(chip.id)).map((chip) => {
        const active = isQuickFilterActive(chip.id, state, userId);
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(toggleQuickFilter(chip.id, state, userId))}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors',
              active ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#464EB8]/40 hover:text-[#464EB8]',
            )}
          >
            {active && <Check className="h-3 w-3" strokeWidth={3} />}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
