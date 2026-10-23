import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type Ref } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn, toDateInput } from '@/lib/utils';

/*
 * The app's date picker: a field that opens a calendar, used instead of the browser's own date input so
 * dates look the same everywhere. Works with the same 'YYYY-MM-DD' strings as <input type="date">,
 * so it drops into forms as-is (TextField uses it for type="date").
 *
 *   <DatePicker value={from} onChange={setFrom} max={today} />
 */

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parse = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const addMonths = (date: Date, months: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
};
const display = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export interface DatePickerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'onChange' | 'min' | 'max'> {
  value?: string | null;
  onChange?: (value: string) => void;
  // Earliest and latest allowed dates, 'YYYY-MM-DD'
  min?: string;
  max?: string;
  placeholder?: string;
  // Show a Clear button (on by default)
  clearable?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function DatePicker({ value, onChange, onBlur, min, max, placeholder = 'Select a date', clearable = true, disabled, className, ref, ...buttonProps }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parse(value ?? undefined);
  const minDate = parse(min);
  const maxDate = parse(max);
  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  // The day with keyboard focus; the calendar shows its month
  const [focused, setFocused] = useState<Date>(selected ?? today);
  const gridRef = useRef<HTMLDivElement>(null);

  const isDisabled = (date: Date) => (!!minDate && date < minDate) || (!!maxDate && date > maxDate);
  const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Opening starts at the chosen date (or today, kept inside the allowed range)
  useEffect(() => {
    if (!open) return;
    const start = selected ?? (maxDate && today > maxDate ? maxDate : minDate && today < minDate ? minDate : today);
    setFocused(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the calendar opens
  }, [open]);

  // Keep keyboard focus on the focused day
  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toDateInput(focused)}"]`)?.focus({ preventScroll: true });
  }, [focused, open]);

  // Six weeks starting on the Monday on or before the 1st
  const days = useMemo(() => {
    const first = new Date(focused.getFullYear(), focused.getMonth(), 1);
    const start = addDays(first, -((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [focused]);

  const years = useMemo(() => {
    const from = minDate?.getFullYear() ?? today.getFullYear() - 100;
    const to = maxDate?.getFullYear() ?? today.getFullYear() + 10;
    return Array.from({ length: to - from + 1 }, (_, index) => to - index);
  }, [minDate, maxDate, today]);

  const choose = (date: Date) => {
    if (isDisabled(date)) return;
    onChange?.(toDateInput(date));
    setOpen(false);
  };

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setFocused(moves[event.key]());
    }
  };

  const todayAllowed = !isDisabled(today);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur?.({} as never);
      }}
    >
      <Popover.Trigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          {...buttonProps}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-white px-3 py-2 text-left text-sm ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            'aria-[invalid=true]:border-red-500',
            className,
          )}
        >
          <span className={cn('truncate', selected ? 'text-gray-900' : 'text-gray-400')}>{selected ? display(selected) : placeholder}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content align="start" sideOffset={6} collisionPadding={12} className="z-[70] w-[19rem] rounded-xl border border-gray-200 bg-white p-3 shadow-xl" onOpenAutoFocus={(event) => event.preventDefault()}>
          {/* Month and year can be picked directly (handy for birthdays), or stepped with the arrows */}
          <div className="mb-2 flex items-center gap-1">
            <button type="button" onClick={() => setFocused(addMonths(focused, -1))} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={focused.getMonth()}
              onChange={(event) => setFocused(new Date(focused.getFullYear(), Number(event.target.value), 1))}
              aria-label="Month"
              className="h-8 flex-1 rounded-md border border-gray-200 bg-white px-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={focused.getFullYear()}
              onChange={(event) => setFocused(new Date(Number(event.target.value), focused.getMonth(), 1))}
              aria-label="Year"
              className="h-8 w-[5.5rem] rounded-md border border-gray-200 bg-white px-1.5 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setFocused(addMonths(focused, 1))} className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div ref={gridRef} role="grid" aria-label={`${MONTHS[focused.getMonth()]} ${focused.getFullYear()}`} onKeyDown={onGridKey} className="grid grid-cols-7 gap-0.5">
            {days.map((date) => {
              const key = toDateInput(date);
              const inMonth = date.getMonth() === focused.getMonth();
              const isSelected = sameDay(date, selected);
              const isToday = sameDay(date, today);
              const off = isDisabled(date);
              return (
                <button
                  key={key}
                  type="button"
                  data-day={key}
                  tabIndex={sameDay(date, focused) ? 0 : -1}
                  disabled={off}
                  aria-pressed={isSelected}
                  aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  onClick={() => choose(date)}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]',
                    isSelected ? 'bg-[#464EB8] font-semibold text-white hover:bg-[#3a3f9a]' : 'hover:bg-indigo-50',
                    !isSelected && (inMonth ? 'text-gray-900' : 'text-gray-400'),
                    !isSelected && isToday && 'font-semibold text-[#464EB8] ring-1 ring-inset ring-[#464EB8]/40',
                    off && 'cursor-not-allowed text-gray-300 hover:bg-transparent',
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
            <button type="button" onClick={() => todayAllowed && choose(today)} disabled={!todayAllowed} className="rounded-md px-2 py-1 text-sm font-medium text-[#464EB8] hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent">
              Today
            </button>
            {clearable && selected && (
              <button
                type="button"
                onClick={() => {
                  onChange?.('');
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
