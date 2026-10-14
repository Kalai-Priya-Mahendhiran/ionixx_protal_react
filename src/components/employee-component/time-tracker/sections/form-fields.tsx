import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface Option {
  value: string;
  label: string;
}

export const toOptions = (values: readonly string[]): Option[] => values.map((value) => ({ value, label: value }));

// Theme focus ring shared by inputs, selects and textareas in the Time Tracker dialogs
export const fieldClass = 'bg-white focus-visible:ring-2 focus-visible:ring-[#464EB8]/30 focus:ring-2 focus:ring-[#464EB8]/30';

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="text-gray-700">
      {children} <span className="text-red-500">*</span>
    </FormLabel>
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  className,
  onValueChange,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: Option[];
  placeholder?: string;
  className?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <RequiredLabel>{label}</RequiredLabel>
          <Select
            value={field.value ?? ''}
            onValueChange={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
          >
            <FormControl>
              <SelectTrigger ref={field.ref} onBlur={field.onBlur} className={fieldClass}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
