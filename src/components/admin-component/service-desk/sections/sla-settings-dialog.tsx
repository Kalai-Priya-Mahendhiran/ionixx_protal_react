import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { fieldClass } from '@/components/ui/form-fields';
import { Input } from '@/components/ui/input';
import { DESKS, REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { SLA_MAX_HOURS, SLA_MIN_HOURS, slaSchema, type SlaFormValues } from '@/lib/form-schemas/desk';
import { cn } from '@/lib/utils';
import { useSaveSla } from '@/services/apis/service-desk/use-service-desk';
import type { SlaTargets } from '@/types';
import { CATEGORY_ICONS } from './desk-icons';

const toValues = (sla: SlaTargets): SlaFormValues =>
  Object.fromEntries(
    REQUEST_CATEGORIES.map((category) => [category, { responseHours: String(sla[category].responseHours), resolutionHours: String(sla[category].resolutionHours) }]),
  ) as SlaFormValues;

const fromValues = (values: SlaFormValues): SlaTargets =>
  Object.fromEntries(
    REQUEST_CATEGORIES.map((category) => [category, { responseHours: Number(values[category].responseHours), resolutionHours: Number(values[category].resolutionHours) }]),
  ) as SlaTargets;

const ROW = 'grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-start gap-2';

function ColumnHeader({ children }: { children: string }) {
  return (
    <span className="text-right">
      {children} <span className="text-red-500">*</span>
    </span>
  );
}

// Response and resolution targets per category (calendar hours; the clock pauses while Waiting)
export function SlaSettingsDialog({ open, onOpenChange, sla }: { open: boolean; onOpenChange: (open: boolean) => void; sla: SlaTargets }) {
  const saveSla = useSaveSla();
  const form = useForm<SlaFormValues>({ resolver: zodResolver(slaSchema), defaultValues: toValues(sla) });

  useEffect(() => {
    if (open) form.reset(toValues(sla));
  }, [open, sla, form]);

  const onSubmit = (values: SlaFormValues) => saveSla.mutate(fromValues(values), { onSuccess: () => onOpenChange(false) });

  const hoursField = (category: (typeof REQUEST_CATEGORIES)[number], key: 'responseHours' | 'resolutionHours', label: string) => (
    <FormField
      control={form.control}
      name={`${category}.${key}`}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormControl>
            <Input
              {...field}
              type="number"
              min={SLA_MIN_HOURS}
              max={SLA_MAX_HOURS}
              step={0.5}
              aria-label={label}
              aria-required
              className={cn(fieldClass, 'h-9 px-2 text-right tabular-nums')}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="SLA targets"
      description="Hours until the first response and until the request is resolved. The resolution clock pauses while a request is Waiting."
      size="lg"
      submitLabel="Save targets"
      pending={saveSla.isPending}
    >
      <div className="text-sm">
        <div className={cn(ROW, 'pb-1.5 text-xs font-semibold text-gray-600')} aria-hidden="true">
          <span>Category</span>
          <ColumnHeader>Respond (h)</ColumnHeader>
          <ColumnHeader>Resolve (h)</ColumnHeader>
        </div>
        {DESKS.map((desk) => (
        <div key={desk.id} className="divide-y divide-gray-100">
          <p className="pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{desk.team}</p>
          {desk.categories.map((category) => {
            const Icon = CATEGORY_ICONS[category];
            const label = REQUEST_CATEGORY_LABELS[category];
            return (
              <div key={category} className={cn(ROW, 'py-1.5')}>
                <span className="inline-flex h-9 items-center gap-2 text-gray-800">
                  <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  {label}
                </span>
                {hoursField(category, 'responseHours', `${label} response hours`)}
                {hoursField(category, 'resolutionHours', `${label} resolution hours`)}
              </div>
            );
          })}
        </div>
        ))}
      </div>
    </FormDialog>
  );
}
