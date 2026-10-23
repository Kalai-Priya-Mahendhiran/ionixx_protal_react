import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { fieldClass, type Option } from '@/components/ui/form-fields';
import { cn } from '@/lib/utils';

/*
 * Click-to-edit fields for the task page (Jira style): each shows its value, and anyone who can edit the task
 * changes it in place. Every field saves on its own; read-only users just see the value.
 */

// Hover outline that hints a value can be edited
const editableClass = 'rounded-md px-1.5 py-1 -mx-1.5 text-left hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/30';

function SaveCancel({ onSave, onCancel, disabled }: { onSave: () => void; onCancel: () => void; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-1.5">
      <Button type="button" size="sm" variant="ghost" onClick={onCancel} className="h-8 px-2" aria-label="Cancel">
        <X className="h-4 w-4" />
      </Button>
      <Button type="button" size="sm" onClick={onSave} disabled={disabled} className="h-8 bg-[#464EB8] px-2 text-white hover:bg-[#3a3f9a]" aria-label="Save">
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ---------- Single-line text (title, estimate) ---------- */

interface InlineTextProps {
  value: string;
  onSave: (value: string) => void;
  editable: boolean;
  ariaLabel: string;
  placeholder?: string;
  // Shown instead of the raw value when not editing
  display?: ReactNode;
  className?: string;
  inputClassName?: string;
  inputMode?: 'text' | 'decimal';
  // Returns an error message, or nothing when the value is fine
  validate?: (value: string) => string | undefined;
  maxLength?: number;
}

export function InlineText({ value, onSave, editable, ariaLabel, placeholder, display, className, inputClassName, inputMode, validate, maxLength }: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const cancel = () => {
    setDraft(value);
    setError(undefined);
    setEditing(false);
  };

  const commit = () => {
    const next = draft.trim();
    const problem = validate?.(next);
    if (problem) {
      setError(problem);
      return;
    }
    if (next !== value) onSave(next);
    setError(undefined);
    setEditing(false);
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') cancel();
  };

  if (!editable) return <span className={className}>{display ?? (value || <span className="text-gray-400">{placeholder ?? 'None'}</span>)}</span>;

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${ariaLabel.toLowerCase()}`} title="Click to edit" className={cn(editableClass, 'group inline-flex w-full items-center gap-2', className)}>
        <span className="min-w-0 flex-1">{display ?? (value || <span className="text-gray-400">{placeholder ?? 'None'}</span>)}</span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <div className="space-y-1.5">
      <Input
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(undefined);
        }}
        onKeyDown={handleKey}
        aria-label={ariaLabel}
        aria-invalid={!!error}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className={cn(fieldClass, inputClassName)}
        autoFocus
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <SaveCancel onSave={commit} onCancel={cancel} />
    </div>
  );
}

/* ---------- Multi-line text (description) ---------- */

interface InlineTextareaProps {
  value: string;
  onSave: (value: string) => void;
  editable: boolean;
  ariaLabel: string;
  placeholder: string;
  emptyText: string;
}

export function InlineTextarea({ value, onSave, editable, ariaLabel, placeholder, emptyText }: InlineTextareaProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (!editing) return;
    const element = textareaRef.current;
    element?.focus();
    element?.setSelectionRange(element.value.length, element.value.length);
  }, [editing]);

  const commit = () => {
    if (draft.trim() !== value.trim()) onSave(draft.trim());
    setEditing(false);
  };

  const shown = value ? (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{value}</p>
  ) : (
    <p className="text-sm text-gray-400">{emptyText}</p>
  );

  if (!editable) return shown;

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${ariaLabel.toLowerCase()}`} title="Click to edit" className={cn(editableClass, 'block w-full min-h-[2.5rem]')}>
        {shown}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={draft}
        rows={6}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setEditing(false);
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            commit();
          }
        }}
        aria-label={ariaLabel}
        placeholder={placeholder}
        maxLength={5000}
        className={fieldClass}
      />
      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-gray-400">Ctrl + Enter to save</span>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={commit} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
          Save
        </Button>
      </div>
    </div>
  );
}

/* ---------- Pick one (assignee, priority, type, sprint, epic…) ---------- */

interface InlineSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  editable: boolean;
  ariaLabel: string;
  // Shown when the field can't be edited (defaults to the option's label)
  display: ReactNode;
}

export function InlineSelect({ value, options, onChange, editable, ariaLabel, display }: InlineSelectProps) {
  if (!editable) return <>{display}</>;
  return (
    <Select value={value} onValueChange={(next) => next !== value && onChange(next)}>
      <SelectTrigger
        aria-label={ariaLabel}
        title="Click to change"
        className="-mx-1.5 h-auto min-h-8 w-[calc(100%+0.75rem)] border-transparent px-1.5 py-1 shadow-none hover:bg-gray-100 focus:ring-2 focus:ring-[#464EB8]/30 data-[state=open]:border-gray-300 data-[state=open]:bg-white [&>svg]:opacity-0 hover:[&>svg]:opacity-50"
      >
        <SelectValue>{display}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              {option.icon}
              <span>
                {option.label}
                {option.hint && <span className="block text-xs text-gray-500">{option.hint}</span>}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------- Date ---------- */

interface InlineDateProps {
  value?: string;
  onChange: (value: string) => void;
  editable: boolean;
  ariaLabel: string;
  display: ReactNode;
  min?: string;
  max?: string;
  clearable?: boolean;
}

export function InlineDate({ value, onChange, editable, ariaLabel, display, min, max, clearable = true }: InlineDateProps) {
  if (!editable) return <>{display}</>;
  return (
    <DatePicker
      value={value ?? ''}
      onChange={(next) => next !== (value ?? '') && onChange(next)}
      min={min}
      max={max}
      clearable={clearable}
      aria-label={ariaLabel}
      placeholder="None"
      className="-mx-1.5 h-8 w-[calc(100%+0.75rem)] border-transparent px-1.5 shadow-none hover:bg-gray-100"
    />
  );
}

/* ---------- Many values: labels and people ---------- */

interface InlineChipsProps {
  values: string[];
  renderChip: (value: string) => ReactNode;
  onChange: (values: string[]) => void;
  editable: boolean;
  ariaLabel: string;
  // Free text entry (labels) with suggestions…
  suggestions?: string[];
  // …or a fixed list to pick from (people)
  options?: Option[];
  emptyText?: string;
}

export function InlineChips({ values, renderChip, onChange, editable, ariaLabel, suggestions, options, emptyText = 'None' }: InlineChipsProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const listId = `${ariaLabel.replace(/\s+/g, '-').toLowerCase()}-suggestions`;

  const add = (value: string) => {
    const next = value.trim();
    if (next && !values.includes(next)) onChange([...values, next]);
    setDraft('');
  };
  const remove = (value: string) => onChange(values.filter((item) => item !== value));
  const pickable = options?.filter((option) => !values.includes(option.value)) ?? [];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {values.length === 0 && !adding && <span className="text-gray-400">{emptyText}</span>}
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-0.5">
          {renderChip(value)}
          {editable && (
            <button type="button" onClick={() => remove(value)} aria-label={`Remove ${value}`} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {editable &&
        (adding ? (
          options ? (
            <Select
              open
              onOpenChange={(open) => !open && setAdding(false)}
              onValueChange={(value) => {
                add(value);
                setAdding(false);
              }}
            >
              <SelectTrigger aria-label={`Add ${ariaLabel.toLowerCase()}`} className="h-7 w-40 text-xs">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {pickable.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">Everyone is already added</p>
                ) : (
                  pickable.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          ) : (
            <>
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    add(draft);
                  } else if (event.key === 'Escape') setAdding(false);
                }}
                onBlur={() => {
                  add(draft);
                  setAdding(false);
                }}
                list={listId}
                aria-label={`Add ${ariaLabel.toLowerCase()}`}
                placeholder="Type and press Enter"
                maxLength={40}
                className="h-7 w-40 text-xs"
                autoFocus
              />
              <datalist id={listId}>
                {(suggestions ?? []).filter((item) => !values.includes(item)).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </>
          )
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            aria-label={`Add ${ariaLabel.toLowerCase()}`}
            className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium text-[#464EB8] hover:bg-indigo-50"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        ))}
    </div>
  );
}
