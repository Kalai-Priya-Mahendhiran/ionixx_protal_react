import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FilterListKey as ListKey, FilterOption } from './filter-options';
import { DUE_FILTER_OPTIONS, EMPTY_FILTERS, countActiveFilters, type AdvancedFilters } from './task-utils';

const SECTION_TITLES: Record<ListKey, string> = {
  projectIds: 'Project',
  sprintIds: 'Sprint',
  departments: 'Department',
  assigneeIds: 'Assignee',
  priorities: 'Priority',
  types: 'Type',
};

// Sprints have their own button next to Filters
const PANEL_KEYS = (Object.keys(SECTION_TITLES) as ListKey[]).filter((key) => key !== 'sprintIds');

function CheckboxRow({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
    >
      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border-2', checked ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-300 bg-white')}>
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

interface AdvancedFiltersButtonProps {
  filters: AdvancedFilters;
  options: Record<ListKey, FilterOption[]>;
  onChange: (filters: AdvancedFilters) => void;
}

export function AdvancedFiltersButton({ filters, options, onChange }: AdvancedFiltersButtonProps) {
  const [open, setOpen] = useState(false);
  // The sprint filter is counted on the Sprint button
  const active = countActiveFilters(filters) - filters.sprintIds.length;

  const toggle = (key: ListKey, value: string) => {
    const current = filters[key] as string[];
    onChange({ ...filters, [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn('h-9 gap-1.5', active > 0 && 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {active > 0 && <span className="rounded-full bg-[#464EB8] px-1.5 text-xs text-white">{active}</span>}
        </Button>
      </Popover.Trigger>

      {/* Portalled and collision-aware, so the panel never slides under the sidebar or off screen */}
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          aria-label="Filters"
          className="z-50 w-[min(640px,calc(100vw-2rem))] rounded-xl border border-indigo-100 bg-white p-4 shadow-xl"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PANEL_KEYS.map((key) => (
              <section key={key} className="min-w-0">
                <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">{SECTION_TITLES[key]}</h3>
                <div className="app-scrollbar max-h-40 overflow-y-auto">
                  {options[key].length === 0 ? (
                    <p className="px-2 py-1 text-xs text-gray-400">Nothing to filter</p>
                  ) : (
                    options[key].map((option) => (
                      <CheckboxRow key={option.value} checked={(filters[key] as string[]).includes(option.value)} label={option.label} onToggle={() => toggle(key, option.value)} />
                    ))
                  )}
                </div>
              </section>
            ))}
            <section>
              <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Due date</h3>
              {DUE_FILTER_OPTIONS.map((option) => (
                <label key={option.value} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-indigo-50">
                  <input
                    type="radio"
                    name="due-filter"
                    checked={filters.due === option.value}
                    onChange={() => onChange({ ...filters, due: option.value })}
                    className="accent-[#464EB8]"
                  />
                  {option.label}
                </label>
              ))}
              <div className="mt-2 border-t border-gray-100 pt-2">
                <CheckboxRow checked={filters.openOnly} label="Hide done work" onToggle={() => onChange({ ...filters, openOnly: !filters.openOnly })} />
              </div>
            </section>
          </div>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ ...EMPTY_FILTERS, sprintIds: filters.sprintIds })} disabled={active === 0}>
              Clear all
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              Done
            </Button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// One removable chip per active filter value
export function ActiveFilterChips({ filters, options, onChange }: AdvancedFiltersButtonProps) {
  if (countActiveFilters(filters) === 0) return null;
  const chips = (Object.keys(SECTION_TITLES) as ListKey[]).flatMap((key) =>
    (filters[key] as string[]).map((value) => ({
      id: `${key}:${value}`,
      label: `${SECTION_TITLES[key]}: ${options[key].find((option) => option.value === value)?.label ?? value}`,
      remove: () => onChange({ ...filters, [key]: (filters[key] as string[]).filter((item) => item !== value) }),
    })),
  );
  if (filters.due !== 'any') {
    chips.push({
      id: 'due',
      label: DUE_FILTER_OPTIONS.find((option) => option.value === filters.due)?.label ?? '',
      remove: () => onChange({ ...filters, due: 'any' }),
    });
  }
  if (filters.openOnly) chips.push({ id: 'open', label: 'Open only', remove: () => onChange({ ...filters, openOnly: false }) });
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
      {chips.map((chip) => (
        <span key={chip.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-1 pl-3 pr-1 text-xs font-medium text-indigo-800">
          {chip.label}
          <button type="button" onClick={chip.remove} aria-label={`Remove ${chip.label}`} className="rounded-full p-0.5 hover:bg-indigo-100">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="text-xs font-medium text-[#464EB8] hover:underline">
        Clear all
      </button>
    </div>
  );
}
