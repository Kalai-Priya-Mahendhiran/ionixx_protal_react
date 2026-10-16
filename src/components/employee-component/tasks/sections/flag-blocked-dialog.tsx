import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { RequiredLabel, fieldClass } from '@/components/ui/form-fields';
import { flagBlockedSchema, type FlagBlockedFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import { useSetBlocked } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';

interface FlagBlockedDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FlagBlockedDialog({ task, open, onOpenChange }: FlagBlockedDialogProps) {
  const setBlocked = useSetBlocked();
  const form = useForm<FlagBlockedFormValues>({ resolver: zodResolver(flagBlockedSchema) });

  useEffect(() => {
    if (open) form.reset({ reason: '' });
  }, [open, form]);

  // Same rule as the service: the assignee's manager, else the reporter
  const helperId = getUserById(task.assigneeId)?.managerId ?? task.reporterId;
  const helperName = getUserById(helperId)?.name ?? 'your manager';

  const onSubmit = ({ reason }: FlagBlockedFormValues) =>
    setBlocked.mutate({ task, blocked: true, reason }, { onSuccess: () => onOpenChange(false) });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={`Flag ${task.key} as blocked`}
      description={`${helperName} will be notified so they can help unblock you.`}
      submitLabel="Flag and request help"
      pendingLabel="Flagging…"
      pending={setBlocked.isPending}
      destructive
    >
      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>What's blocking you?</RequiredLabel>
            <FormControl>
              <Textarea {...field} rows={4} placeholder="e.g. Waiting for API credentials from the platform team" className={fieldClass} autoFocus />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormDialog>
  );
}
