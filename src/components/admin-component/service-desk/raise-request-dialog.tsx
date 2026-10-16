import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass } from '@/components/ui/form-fields';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_HINTS, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { canRaiseRequest } from '@/lib/permissions/desk-permissions';
import { TASK_PRIORITIES, adminRequestSchema, type AdminRequestFormValues } from '@/lib/schemas';
import { USER_DIRECTORY } from '@/lib/user-directory';
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
  const canRaiseForOthers = !!user && USER_DIRECTORY.some((member) => member.id !== user.id && canRaiseRequest(user, member.id));

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
    <Dialog open={open} onOpenChange={(next) => !raise.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Raise an Admin request</DialogTitle>
          <DialogDescription>The Admin team gets notified straight away. You'll see updates in My Requests.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Summary</RequiredLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. AC not working in Meeting Room 3" className={fieldClass} maxLength={120} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Details</RequiredLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder={category === 'travel' ? 'From, to, dates and times, and any preferences' : 'What do you need, where, and by when?'}
                      className={fieldClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="priority" label="Priority" options={TASK_PRIORITIES.map((value) => ({ value, label: getPriorityLabel(value) }))} />
              {canRaiseForOthers && (
                <FormField
                  control={form.control}
                  name="onBehalfOfId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">On behalf of</FormLabel>
                      <select
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                        aria-label="On behalf of"
                        className={cn('h-10 w-full rounded-md border border-input px-3 text-sm', fieldClass)}
                      >
                        <option value="">Myself</option>
                        {[...USER_DIRECTORY]
                          .filter((member) => member.id !== user?.id)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name} · {member.designation}
                            </option>
                          ))}
                      </select>
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Attachment <span className="font-normal text-gray-500">(optional, e.g. a photo or a quote)</span>
              </p>
              <AttachmentDropzone compact onUploaded={(uploaded) => setAttachments((current) => [...current, ...uploaded])} />
              <AttachmentList attachments={attachments} onRemove={(attachment) => setAttachments((current) => current.filter((item) => item.id !== attachment.id))} />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={raise.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={raise.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {raise.isPending ? 'Raising…' : 'Raise request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
