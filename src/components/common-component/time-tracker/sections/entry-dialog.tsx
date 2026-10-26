import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { useProjectNames } from '@/services/apis/time-tracker/use-task-log';
import type { TimeEntry } from '@/types';
import { todayAsDateInput } from '@/lib/utils';
import { timeEntrySchema, type TimeEntryFormValues } from '@/lib/schemas';
import { emptyTimeEntry, hoursBetween } from './time-entry-form';
import { SelectField, TextField, TextareaField, toOptions } from '@/components/ui/form-fields';
import { TIME_TRACKER_MODULES, TIME_TRACKER_TASK_TYPES } from '@/lib/constants';

const MODULE_OPTIONS = toOptions(TIME_TRACKER_MODULES);
const TASK_TYPE_OPTIONS = toOptions(TIME_TRACKER_TASK_TYPES);

interface EntryDialogProps {
  entry?: TimeEntry;
  onClose: () => void;
  onSave: (values: TimeEntryFormValues) => void;
}

export function EntryDialog({ entry, onClose, onSave }: EntryDialogProps) {
  // Live: projects added in Tasks show up here
  const projectOptions = toOptions(useProjectNames());
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
    <FormDialog
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      form={form}
      onSubmit={onSave}
      title={entry ? 'Edit time entry' : 'Add time entry'}
      size="2xl"
      submitLabel={entry ? 'Save changes' : 'Save entry'}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField control={control} name="project" label="Project" placeholder="Select project" options={projectOptions} />
        <SelectField control={control} name="module" label="Epic / Module" placeholder="Select epic or module" options={MODULE_OPTIONS} />
        <SelectField
          control={control}
          name="task"
          label="User story / task"
          placeholder="Select task type"
          options={TASK_TYPE_OPTIONS}
          className="sm:col-span-2"
        />
        <TextareaField control={control} name="description" label="Description" rows={2} placeholder="Describe the work done" className="sm:col-span-2" required />
        <TextField control={control} name="date" label="Date" type="date" max={todayAsDateInput()} className="sm:col-span-2" required />
        <TextField control={control} name="startTime" label="Start time" type="time" required />
        <TextField control={control} name="endTime" label="End time" type="time" required />
      </div>

      <p className="text-sm text-gray-600">
        Hours logged: <span className="font-semibold text-[#464EB8]">{loggedHours}h</span>
      </p>
    </FormDialog>
  );
}
