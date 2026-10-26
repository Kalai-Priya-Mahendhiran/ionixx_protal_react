import { useEffect, useRef, useState } from 'react';
import { Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEAVE_STATUS_FILTER_OPTIONS } from '@/lib/constants';
import type { LeaveRequest } from '@/types';
import { ALL_LEAVE_STATUSES } from './leave-utils';

type LeaveStatus = LeaveRequest['status'];

function FilterCheckbox({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-indigo-50"
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
          checked ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-indigo-300 bg-white'
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

interface LeaveStatusFilterProps {
  selected: LeaveStatus[];
  counts: Record<LeaveStatus, number>;
  onApply: (statuses: LeaveStatus[]) => void;
}

export function LeaveStatusFilter({ selected, counts, onApply }: LeaveStatusFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LeaveStatus[]>(selected);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFiltered = selected.length < ALL_LEAVE_STATUSES.length;
  const allChecked = draft.length === ALL_LEAVE_STATUSES.length;

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const toggleOpen = () => {
    setDraft(selected);
    setOpen((current) => !current);
  };

  const toggleStatus = (status: LeaveStatus) =>
    setDraft((current) => current.includes(status) ? current.filter((item) => item !== status) : [...current, status]);

  const applyFilter = () => {
    onApply(ALL_LEAVE_STATUSES.filter((status) => draft.includes(status)));
    setOpen(false);
  };

  const clearFilter = () => {
    onApply(ALL_LEAVE_STATUSES);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={toggleOpen}
        aria-expanded={open}
        className={`gap-2 ${isFiltered ? 'border-[#464EB8] text-[#464EB8] bg-indigo-50' : 'text-gray-700'}`}
      >
        <Filter className={`h-4 w-4 ${isFiltered ? 'fill-[#464EB8]/20' : ''}`} />
        Filter
        {isFiltered && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#464EB8] px-1.5 text-xs text-white">
            {selected.length}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-indigo-100 bg-white p-3 shadow-xl">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Filter by status</p>
          <FilterCheckbox
            checked={allChecked}
            label="Select All"
            onToggle={() => setDraft(allChecked ? [] : ALL_LEAVE_STATUSES)}
          />
          <div className="my-1 border-t border-indigo-50" />
          {LEAVE_STATUS_FILTER_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center justify-between">
              <FilterCheckbox
                checked={draft.includes(option.value)}
                label={option.label}
                onToggle={() => toggleStatus(option.value)}
              />
              <span className="pr-2 text-xs font-medium text-gray-400">{counts[option.value]}</span>
            </div>
          ))}
          <div className="mt-3 flex gap-2 border-t border-indigo-50 pt-3">
            <Button
              type="button"
              size="sm"
              onClick={applyFilter}
              disabled={draft.length === 0}
              className="flex-1 bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
            >
              Filter
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={clearFilter} className="flex-1">
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
