import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, TextField, TextareaField } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_HINTS, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { canRaiseRequest } from '@/lib/permissions/desk-permissions';
import { TASK_PRIORITIES, adminRequestSchema, type AdminRequestFormValues } from '@/lib/schemas';
import { getActiveUsers } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { getPriorityLabel } from '@/lib/workflow';
import { useRaiseRequest } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, TaskAttachment } from '@/types';
import { AttachmentDropzone, AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';
import { CATEGORY_ICONS } from './desk-icons';

const DEFAULTS: AdminRequestFormValues = { category: 'asset', title: '', description: '', priority: 'medium', onBehalfOfId: '' };

// Raise an Admin request (asset, facility, supplies, transport, travel, visitor, other)
export function RaiseRequestDialog({ open, onOpenChange, onRaised }: { open: boolean; onOpenChange: (open: boolean) => void; onRaised?: (request: AdminRequest) => void }) {
  const { user } = useAuth();
  const raise = useRaiseRequest();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const form = useForm<AdminRequestFormValues>({ resolver: zodResolver(adminRequestSchema), defaultValues: DEFAULTS });
  const category = form.watch('category');
  // HR (and Admin) can raise requests for someone else, e.g. a new joiner
  const canRaiseForOthers = !!user && getActiveUsers().some((member) => member.id !== user.id && canRaiseRequest(user, member.id));
  const behalfOptions = [
    { value: '', label: 'Myself' },
    ...getActiveUsers()
      .filter((member) => member.id !== user?.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((member) => ({ value: member.id, label: `${member.name} · ${member.designation}` })),
  ];

  useEffect(() => {
    if (!open) return;
    form.reset(DEFAULTS);
    setAttachments([]);
  }, [open, form]);

  const onSubmit = (values: AdminRequestFormValues) =>
    raise.mutate(
      { ...values, onBehalfOfId: values.onBehalfOfId || undefined, attachments },
      {
        onSuccess: (request) => {
          onOpenChange(false);
          onRaised?.(request);
        },
      },
    );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Raise an Admin request"
      description="The Admin team gets notified straight away. You'll see updates in My Requests."
      size="2xl"
      submitLabel="Raise request"
      pendingLabel="Raising…"
      pending={raise.isPending}
    >
      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>Category</RequiredLabel>
            <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {REQUEST_CATEGORIES.map((value) => {
                const Icon = CATEGORY_ICONS[value];
                const selected = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(value)}
                    title={REQUEST_CATEGORY_HINTS[value]}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors',
                      selected ? 'border-[#464EB8] bg-indigo-50 ring-1 ring-[#464EB8]' : 'border-gray-200 bg-white hover:border-[#464EB8]/40',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', selected ? 'text-[#464EB8]' : 'text-gray-500')} aria-hidden="true" />
                    <span className="text-sm font-medium text-gray-900">{REQUEST_CATEGORY_LABELS[value]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">{REQUEST_CATEGORY_HINTS[category]}</p>
            <FormMessage />
          </FormItem>
        )}
      />

      <TextField control={form.control} name="title" label="Summary" placeholder="e.g. AC not working in Meeting Room 3" maxLength={120} required />

      <TextareaField
        control={form.control}
        name="description"
        label="Details"
        rows={4}
        placeholder={category === 'travel' ? 'From, to, dates and times, and any preferences' : 'What do you need, where, and by when?'}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField control={form.control} name="priority" label="Priority" options={TASK_PRIORITIES.map((value) => ({ value, label: getPriorityLabel(value) }))} />
        {canRaiseForOthers && (
          // "Myself" is the empty value, so it doubles as the placeholder
          <SelectField control={form.control} name="onBehalfOfId" label="On behalf of" options={behalfOptions} placeholder="Myself" required={false} />
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Attachment <span className="font-normal text-gray-500">(optional, e.g. a photo or a quote)</span>
        </p>
        <AttachmentDropzone compact onUploaded={(uploaded) => setAttachments((current) => [...current, ...uploaded])} />
        <AttachmentList attachments={attachments} onRemove={(attachment) => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} />
      </div>
    </FormDialog>
  );
}
