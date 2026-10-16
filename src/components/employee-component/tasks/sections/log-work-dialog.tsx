import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { RequiredLabel, fieldClass } from '@/components/ui/form-fields';
import { logWorkSchema, type LogWorkFormValues } from '@/lib/schemas';
import { todayAsDateInput } from '@/lib/utils';
import { useLogWork } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';

interface LogWorkDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogWorkDialog({ task, open, onOpenChange }: LogWorkDialogProps) {
  const logWork = useLogWork();
  const form = useForm<LogWorkFormValues>({ resolver: zodResolver(logWorkSchema) });
  const hours = Number(useWatch({ control: form.control, name: 'hours' })) || 0;

  useEffect(() => {
    if (open) form.reset({ date: todayAsDateInput(), startTime: '09:00', hours: '', note: '' });
  }, [open, form]);

  const remaining = task.estimateHours !== undefined ? task.estimateHours - task.loggedHours - hours : undefined;

  const onSubmit = (values: LogWorkFormValues) =>
    logWork.mutate(
      { task, input: { date: values.date, startTime: values.startTime, hours: Number(values.hours), note: values.note } },
      { onSuccess: () => onOpenChange(false) },
    );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={`Log work on ${task.key}`}
      description="The hours are added to this task and to your Time Tracker."
      submitLabel="Log work"
      pendingLabel="Logging…"
      pending={logWork.isPending}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>Date</RequiredLabel>
              <FormControl>
                <Input {...field} type="date" max={todayAsDateInput()} className={fieldClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>Start time</RequiredLabel>
              <FormControl>
                <Input {...field} type="time" className={fieldClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="hours"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>Hours worked</RequiredLabel>
            <FormControl>
              <Input {...field} inputMode="decimal" placeholder="e.g. 1.5" className={fieldClass} autoFocus />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="note"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">What did you work on?</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} placeholder="Optional note for your work log" className={fieldClass} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <p className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
        <Clock className="h-3.5 w-3.5" />
        Logged so far: {task.loggedHours}h
        {task.estimateHours !== undefined && ` of ${task.estimateHours}h estimated`}
        {remaining !== undefined && hours > 0 && (
          <span className={remaining < 0 ? 'font-medium text-red-700' : ''}>
            {' '}· {remaining < 0 ? `${Math.abs(remaining)}h over estimate` : `${remaining}h left after this`}
          </span>
        )}
      </p>
    </FormDialog>
  );
}
