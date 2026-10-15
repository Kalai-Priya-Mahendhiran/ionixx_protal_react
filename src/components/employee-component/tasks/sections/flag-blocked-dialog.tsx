import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
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
    <Dialog open={open} onOpenChange={(next) => !setBlocked.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Flag {task.key} as blocked</DialogTitle>
          <DialogDescription>
            {helperName} will be notified so they can help unblock you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={setBlocked.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={setBlocked.isPending} className="bg-red-600 text-white hover:bg-red-700">
                {setBlocked.isPending ? 'Flagging…' : 'Flag and request help'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
