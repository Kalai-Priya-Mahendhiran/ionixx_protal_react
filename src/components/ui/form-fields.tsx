import type { HTMLInputTypeAttribute, ReactNode } from 'react';
import { DatePicker } from './date-picker';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Check } from 'lucide-react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/*
 * Form fields for react-hook-form + zod (shadcn Form). Every field shows its label, a red * when
 * `required`, an optional hint and its zod error. Use them inside <FormDialog> or any shadcn <Form>.
 */

export interface Option {
  value: string;
  label: string;
  // Shown before the label, in the list and in the selected value
  icon?: ReactNode;
  // Secondary line shown only in the open list
  hint?: string;
}

export const toOptions = (values: readonly string[]): Option[] => values.map((value) => ({ value, label: value }));

// Theme focus ring shared by every input, select and textarea
export const fieldClass = 'bg-white focus-visible:ring-2 focus-visible:ring-[#464EB8]/30 focus:ring-2 focus:ring-[#464EB8]/30';

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="text-gray-700">
      {children} <span className="text-red-500">*</span>
    </FormLabel>
  );
}

// Label with the red asterisk when required
export function FieldLabel({ label, required = false }: { label: ReactNode; required?: boolean }) {
  return required ? <RequiredLabel>{label}</RequiredLabel> : <FormLabel className="text-gray-700">{label}</FormLabel>;
}

interface BaseFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  className,
  disabled,
  type = 'text',
  placeholder,
  maxLength,
  inputMode,
  autoFocus,
  min,
  max,
  step,
  autoComplete,
}: BaseFieldProps<T> & {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  autoComplete?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <FormControl>
            {type === 'date' ? (
              // Dates use the app's calendar picker rather than the browser's date input
              <DatePicker {...field} value={field.value ?? ''} min={min === undefined ? undefined : String(min)} max={max === undefined ? undefined : String(max)} placeholder={placeholder} disabled={disabled} aria-required={required || undefined} className={fieldClass} />
            ) : (
            <Input
              {...field}
              value={field.value ?? ''}
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              inputMode={inputMode}
              autoFocus={autoFocus}
              min={min}
              max={max}
              step={step}
              autoComplete={autoComplete}
              disabled={disabled}
              aria-required={required || undefined}
              className={fieldClass}
            />
            )}
          </FormControl>
          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  className,
  disabled,
  placeholder,
  rows = 3,
  maxLength,
}: BaseFieldProps<T> & { placeholder?: string; rows?: number; maxLength?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <FormControl>
            <Textarea {...field} value={field.value ?? ''} rows={rows} placeholder={placeholder} maxLength={maxLength} disabled={disabled} aria-required={required || undefined} className={fieldClass} />
          </FormControl>
          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Radix Select can't hold an empty value, so an option like { value: '', label: 'None' } is stored under this key
const EMPTY_OPTION = '__empty__';
const toSelectValue = (value: string) => (value === '' ? EMPTY_OPTION : value);
const fromSelectValue = (value: string) => (value === EMPTY_OPTION ? '' : value);

// Selects default to required, as most choices in the app are mandatory; pass required={false} for optional ones.
// An option with value '' (e.g. "None", "Myself") is allowed and stores ''.
export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  className,
  onValueChange,
  required = true,
  hint,
  disabled,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: Option[];
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FieldLabel label={label} required={required} />
          <Select
            value={field.value === '' && options.some((option) => option.value === '') ? EMPTY_OPTION : (field.value ?? '')}
            disabled={disabled}
            onValueChange={(selected) => {
              const value = fromSelectValue(selected);
              field.onChange(value);
              onValueChange?.(value);
            }}
          >
            <FormControl>
              <SelectTrigger ref={field.ref} onBlur={field.onBlur} aria-required={required || undefined} className={fieldClass}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value || EMPTY_OPTION} value={toSelectValue(option.value)}>
                  {option.icon || option.hint ? (
                    <span className="flex items-center gap-2">
                      {option.icon}
                      <span>
                        {option.label}
                        {/* The trigger is a <button>, so the hint only shows in the open list */}
                        {option.hint && <span className="block text-xs text-gray-500 [button_&]:hidden">{option.hint}</span>}
                      </span>
                    </span>
                  ) : (
                    option.label
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// A single yes/no option, e.g. "Enabled"
export function CheckboxField<T extends FieldValues>({ control, name, label, hint, className, disabled }: Omit<BaseFieldProps<T>, 'required'>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('space-y-0', className)}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-indigo-50/40">
            <FormControl>
              <button
                type="button"
                role="checkbox"
                aria-checked={!!field.value}
                disabled={disabled}
                onClick={() => field.onChange(!field.value)}
                onBlur={field.onBlur}
                ref={field.ref}
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40',
                  field.value ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-300 bg-white',
                )}
              >
                {field.value && <Check className="h-3 w-3" strokeWidth={3} />}
              </button>
            </FormControl>
            <span className="text-sm">
              <span className="font-medium text-gray-900">{label}</span>
              {hint && <span className="block text-xs text-gray-500">{hint}</span>}
            </span>
          </label>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Several options from a list, stored as string[] (e.g. learners for a course)
export function MultiCheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  hint,
  className,
  options,
}: BaseFieldProps<T> & { options: Option[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = field.value ?? [];
        const toggle = (id: string) => field.onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
        return (
          <FormItem className={className}>
            <FieldLabel label={label} required={required} />
            {hint && <FormDescription className="text-xs">{hint}</FormDescription>}
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-1" role="group" aria-required={required || undefined}>
              {options.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(option.value)}
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-indigo-50"
                    >
                      <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border-2', checked ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-300 bg-white')}>
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{option.label}</span>
                        {option.hint && <span className="block truncate text-xs text-gray-500">{option.hint}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
