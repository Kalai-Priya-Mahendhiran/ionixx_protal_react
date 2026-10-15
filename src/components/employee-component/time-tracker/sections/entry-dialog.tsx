import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { PROJECTS, MODULES, TASK_TYPES } from '@/lib/sample-data/time-tracker-sample-data';
import type { TimeEntry } from '@/types';
import { todayAsDateInput } from '@/lib/utils';
import { timeEntrySchema, type TimeEntryFormValues } from '@/lib/schemas';
import { emptyTimeEntry, hoursBetween } from './time-entry-form';
import { RequiredLabel, SelectField, fieldClass, toOptions } from '@/components/ui/form-fields';

const PROJECT_OPTIONS = toOptions(PROJECTS);
const MODULE_OPTIONS = toOptions(MODULES);
const TASK_TYPE_OPTIONS = toOptions(TASK_TYPES);

interface EntryDialogProps {
  entry?: TimeEntry;
  onClose: () => void;
  onSave: (values: TimeEntryFormValues) => void;
}

export function EntryDialog({ entry, onClose, onSave }: EntryDialogProps) {
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: entry
      ? {
          project: entry.project,
          module: entry.module ?? '',
          task: entry.task,
          description: entry.description,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
        }
      : { ...emptyTimeEntry, date: todayAsDateInput() },
  });
  const { control } = form;

  const [startTime, endTime] = useWatch({ control, name: ['startTime', 'endTime'] });
  const loggedHours = startTime && endTime && endTime > startTime ? hoursBetween(startTime, endTime) : 0;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">{entry ? 'Edit time entry' : 'Add time entry'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-5 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={control} name="project" label="Project" placeholder="Select project" options={PROJECT_OPTIONS} />
              <SelectField control={control} name="module" label="Epic / Module" placeholder="Select epic or module" options={MODULE_OPTIONS} />
              <SelectField
                control={control}
                name="task"
                label="User story / task"
                placeholder="Select task type"
                options={TASK_TYPE_OPTIONS}
                className="sm:col-span-2"
              />

              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <RequiredLabel>Description</RequiredLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} placeholder="Describe the work done" className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="date"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <RequiredLabel>Date</RequiredLabel>
                    <FormControl>
                      <Input {...field} type="date" max={todayAsDateInput()} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
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

              <FormField
                control={control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>End time</RequiredLabel>
                    <FormControl>
                      <Input {...field} type="time" className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-sm text-gray-600">
              Hours logged: <span className="font-semibold text-[#464EB8]">{loggedHours}h</span>
            </p>

            <DialogFooter className="gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {entry ? 'Save changes' : 'Save entry'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
