import { useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLabelColor } from './task-config';

const MAX_LABEL_LENGTH = 40;

export function LabelChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium', getLabelColor(label))}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove label ${label}`}
          className="rounded opacity-60 hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface LabelSelectProps {
  value: string[];
  onChange: (labels: string[]) => void;
  // Labels to offer: the configured ones (Settings → Types & Labels) plus any already in use
  options: string[];
  disabled?: boolean;
  // 'field' looks like a form input (dialogs); 'inline' looks like plain text until hovered (task page)
  variant?: 'field' | 'inline';
  placeholder?: ReactNode;
  className?: string;
}

// Pick labels from a searchable dropdown; typing a new name offers to create it
export function LabelSelect({ value, onChange, options, disabled = false, variant = 'field', placeholder = 'Select labels', className }: LabelSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const all = useMemo(() => [...new Set([...options, ...value])].sort((a, b) => a.localeCompare(b)), [options, value]);
  const term = query.trim();
  const matches = all.filter((label) => label.toLowerCase().includes(term.toLowerCase()));
  const canCreate = !!term && !all.some((label) => label.toLowerCase() === term.toLowerCase());
  // Rows in the list: matching labels, then "Create …" when the text is new
  const rows = [...matches.map((label) => ({ kind: 'label' as const, label })), ...(canCreate ? [{ kind: 'create' as const, label: term }] : [])];

  const toggle = (label: string) => onChange(value.includes(label) ? value.filter((item) => item !== label) : [...value, label]);
  const choose = (row: (typeof rows)[number]) => {
    if (row.kind === 'create') {
      onChange([...value, row.label.slice(0, MAX_LABEL_LENGTH)]);
      setQuery('');
    } else toggle(row.label);
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (rows.length) setHighlighted((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = rows[highlighted];
      if (row) choose(row);
    } else if (event.key === 'Backspace' && !query && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  if (disabled) {
    return value.length ? (
      <span className="flex flex-wrap gap-1">
        {value.map((label) => (
          <LabelChip key={label} label={label} />
        ))}
      </span>
    ) : (
      <span className="text-gray-400">None</span>
    );
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
        setHighlighted(0);
      }}
    >
      <Popover.Trigger asChild>
        <div
          role="combobox"
          tabIndex={0}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Labels"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
            }
          }}
          className={cn(
            'group flex w-full cursor-pointer flex-wrap items-center gap-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/30',
            variant === 'field'
              ? 'min-h-10 rounded-md border border-input bg-white px-3 py-1.5 shadow-sm'
              : '-mx-1.5 min-h-8 w-[calc(100%+0.75rem)] rounded-md px-1.5 py-1 hover:bg-gray-100',
            className,
          )}
        >
          {value.length === 0 ? (
            <span className="flex-1 text-gray-400">{placeholder}</span>
          ) : (
            value.map((label) => <LabelChip key={label} label={label} onRemove={() => toggle(label)} />)
          )}
          <ChevronDown className={cn('ml-auto h-4 w-4 shrink-0 text-gray-400', variant === 'inline' && 'opacity-0 group-hover:opacity-100')} />
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} collisionPadding={16} className="z-50 w-64 rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg">
          <div className="relative mb-1">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKey}
              placeholder="Search or create a label"
              aria-label="Search labels"
              maxLength={MAX_LABEL_LENGTH}
              className="h-8 w-full rounded-md border border-gray-200 pl-7 pr-2 text-sm focus:border-[#464EB8]/50 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/20"
              autoFocus
            />
          </div>
          <ul role="listbox" aria-multiselectable="true" className="app-scrollbar max-h-56 overflow-y-auto">
            {rows.length === 0 && <li className="px-2 py-2 text-xs text-gray-500">No labels yet — type a name to create one.</li>}
            {rows.map((row, index) => {
              const selected = row.kind === 'label' && value.includes(row.label);
              return (
                <li key={`${row.kind}-${row.label}`} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => choose(row)}
                    className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm', index === highlighted ? 'bg-indigo-50' : 'hover:bg-gray-50')}
                  >
                    {row.kind === 'create' ? (
                      <>
                        <Plus className="h-4 w-4 text-[#464EB8]" />
                        <span>
                          Create <span className="font-medium">“{row.label}”</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border-2', selected ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-300 bg-white')}>
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <LabelChip label={row.label} />
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
