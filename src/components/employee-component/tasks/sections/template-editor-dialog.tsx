import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass, type Option } from '@/components/ui/form-fields';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TASK_PRIORITIES, TEMPLATE_KINDS, TEMPLATE_OWNERS, templateSchema, type TemplateFormValues } from '@/lib/schemas';
import { TEMPLATE_ANCHOR_LABELS, TEMPLATE_KIND_LABELS, TEMPLATE_OWNER_LABELS } from '@/lib/task-templates';
import { getActiveUsers } from '@/lib/user-directory';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { cn } from '@/lib/utils';
import { useCreateTemplate, useUpdateTemplate } from '@/services/apis/templates/use-templates';
import type { RequestCategory, TaskTemplate } from '@/types';
import { TASK_PRIORITY_CONFIG } from './task-config';

const KIND_OPTIONS: Option[] = TEMPLATE_KINDS.map((value) => ({ value, label: TEMPLATE_KIND_LABELS[value] }));

const newItem = (): TemplateFormValues['items'][number] => ({
  id: '',
  title: '',
  owner: 'hr',
  ownerId: '',
  requestCategory: 'asset',
  offsetDays: '0',
  priority: 'medium',
  estimateHours: '',
});

const toFormValues = (template?: TaskTemplate): TemplateFormValues =>
  template
    ? {
        name: template.name,
        kind: template.kind,
        description: template.description ?? '',
        items: template.items.map((item) => ({
          id: item.id,
          title: item.title,
          owner: item.owner,
          ownerId: item.ownerId ?? '',
          requestCategory: item.requestCategory ?? 'asset',
          offsetDays: String(item.offsetDays),
          priority: item.priority,
          estimateHours: item.estimateHours?.toString() ?? '',
        })),
      }
    : { name: '', kind: 'onboarding', description: '', items: [newItem()] };

// Compact select used inside item rows
function RowSelect({ value, onChange, options, label, invalid }: { value: string; onChange: (value: string) => void; options: Option[]; label: string; invalid?: boolean }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn(fieldClass, 'h-9', invalid && 'border-red-400')}>
        <SelectValue placeholder="Choose…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ItemRow({ control, index, count, onMove, onRemove }: { control: Control<TemplateFormValues>; index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const owner = useWatch({ control, name: `items.${index}.owner` });
  return (
    <li className="grid grid-cols-12 items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5">
      <div className="col-span-12 flex items-center gap-1 sm:col-span-1 sm:flex-col sm:pt-1">
        <span className="w-6 text-center text-xs font-semibold text-gray-400">{index + 1}</span>
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <FormField
        control={control}
        name={`items.${index}.title`}
        render={({ field }) => (
          <FormItem className="col-span-12 sm:col-span-4">
            <FormControl>
              <Input {...field} placeholder="What needs to be done?" aria-label={`Item ${index + 1} title`} className={cn(fieldClass, 'h-9')} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <div className="col-span-12 space-y-1.5 sm:col-span-3">
        <FormField
          control={control}
          name={`items.${index}.owner`}
          render={({ field }) => (
            <RowSelect value={field.value} onChange={field.onChange} label={`Item ${index + 1} owner`} options={TEMPLATE_OWNERS.map((value) => ({ value, label: TEMPLATE_OWNER_LABELS[value] }))} />
          )}
        />
        {owner === 'specific' && (
          <FormField
            control={control}
            name={`items.${index}.ownerId`}
            render={({ field, fieldState }) => (
              <FormItem>
                <RowSelect
                  value={field.value}
                  onChange={field.onChange}
                  label={`Item ${index + 1} person`}
                  invalid={!!fieldState.error}
                  options={getActiveUsers().map((member) => ({ value: member.id, label: `${member.name} · ${member.designation}` }))}
                />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        )}
        {owner === 'admin' && (
          <FormField
            control={control}
            name={`items.${index}.requestCategory`}
            render={({ field }) => (
              <RowSelect
                value={field.value}
                onChange={field.onChange}
                label={`Item ${index + 1} request category`}
                options={REQUEST_CATEGORIES.map((value) => ({ value, label: `${REQUEST_CATEGORY_LABELS[value]} request` }))}
              />
            )}
          />
        )}
      </div>
      <FormField
        control={control}
        name={`items.${index}.offsetDays`}
        render={({ field }) => (
          <FormItem className="col-span-4 sm:col-span-1">
            <FormControl>
              <Input {...field} type="number" step={1} aria-label={`Item ${index + 1} day`} className={cn(fieldClass, 'h-9 px-2')} />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`items.${index}.priority`}
        render={({ field }) => (
          <div className="col-span-4 sm:col-span-2">
            <RowSelect value={field.value} onChange={field.onChange} label={`Item ${index + 1} priority`} options={TASK_PRIORITIES.map((value) => ({ value, label: TASK_PRIORITY_CONFIG[value].label }))} />
          </div>
        )}
      />
      <div className="col-span-4 flex items-start gap-1 sm:col-span-1">
        <FormField
          control={control}
          name={`items.${index}.estimateHours`}
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1">
              <FormControl>
                <Input {...field} inputMode="decimal" placeholder="h" aria-label={`Item ${index + 1} estimate in hours`} className={cn(fieldClass, 'h-9 px-2')} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <button type="button" aria-label={`Remove item ${index + 1}`} disabled={count === 1} onClick={onRemove} className="mt-1.5 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

interface TemplateEditorDialogProps {
  open: boolean;
  // Editing when set; creating (or duplicating, via `initial`) otherwise
  template?: TaskTemplate;
  initial?: TaskTemplate;
  onOpenChange: (open: boolean) => void;
}

export function TemplateEditorDialog({ open, template, initial, onOpenChange }: TemplateEditorDialogProps) {
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const isSaving = createTemplate.isPending || updateTemplate.isPending;
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema) });
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'items' });
  const kind = useWatch({ control: form.control, name: 'kind' });

  useEffect(() => {
    if (!open) return;
    const values = toFormValues(template ?? initial);
    // A duplicate gets a new name and fresh item IDs
    form.reset(initial && !template ? { ...values, name: `${values.name} (copy)`, items: values.items.map((item) => ({ ...item, id: '' })) } : values);
  }, [open, template, initial, form]);

  const onSubmit = (values: TemplateFormValues) => {
    const input = {
      name: values.name,
      kind: values.kind,
      description: values.description,
      items: values.items.map((item) => ({
        id: item.id,
        title: item.title,
        owner: item.owner,
        ownerId: item.ownerId || undefined,
        requestCategory: item.owner === 'admin' ? (item.requestCategory as RequestCategory) : undefined,
        offsetDays: Number(item.offsetDays),
        priority: item.priority,
        estimateHours: item.estimateHours ? Number(item.estimateHours) : undefined,
      })),
    };
    const close = { onSuccess: () => onOpenChange(false) };
    if (template) updateTemplate.mutate({ id: template.id, input }, close);
    else createTemplate.mutate(input, close);
  };

  const itemsError = form.formState.errors.items?.root?.message ?? form.formState.errors.items?.message;

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-indigo-100 px-6 py-4 pr-12">
          <DialogTitle className="text-xl">{template ? `Edit "${template.name}"` : 'New template'}</DialogTitle>
          <DialogDescription>Changes apply to checklists created from now on; existing checklists keep their tasks.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="ionixx-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <RequiredLabel>Template name</RequiredLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Intern Onboarding" className={fieldClass} autoFocus />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SelectField control={form.control} name="kind" label="Type" options={KIND_OPTIONS} />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="When to use this template" className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <section className="space-y-2">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Items ({fields.length})</h3>
                    <p className="text-xs text-gray-500">
                      Day is counted from the {TEMPLATE_ANCHOR_LABELS[kind ?? 'onboarding'].toLowerCase()}: −3 is three days before, 0 is the day itself.
                    </p>
                  </div>
                  <p className="hidden text-xs text-gray-400 sm:block">Title · Owner · Day · Priority · Estimate</p>
                </div>
                <ul className="space-y-2">
                  {fields.map((field, index) => (
                    <ItemRow key={field.id} control={form.control} index={index} count={fields.length} onMove={move} onRemove={() => remove(index)} />
                  ))}
                </ul>
                {itemsError && <p className="text-sm text-red-600">{itemsError}</p>}
                <Button type="button" variant="outline" size="sm" onClick={() => append(newItem())} disabled={fields.length >= 30} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
              </section>
            </div>
            <div className="flex justify-end gap-2 border-t border-indigo-100 bg-gray-50/60 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {isSaving ? 'Saving…' : template ? 'Save template' : 'Create template'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
