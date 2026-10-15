import { useFieldArray, useForm, useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { PROJECTS, MODULES, TASK_TYPES, TASK_STATUS_OPTIONS } from '@/lib/sample-data/time-tracker-sample-data';
import { todayAsDateInput } from '@/lib/utils';
import { timeTrackerTaskFormSchema, timeTrackerTaskSchema, type TimeTrackerTaskFormValues } from '@/lib/schemas';
import { emptyTask, type TaskRecord } from './task-form';
import { RequiredLabel, SelectField, fieldClass, toOptions } from '@/components/ui/form-fields';

type TaskFieldName = FieldPath<TimeTrackerTaskFormValues>;

const PROJECT_OPTIONS = toOptions(PROJECTS);
const MODULE_OPTIONS = toOptions(MODULES);
const TASK_TYPE_OPTIONS = toOptions(TASK_TYPES);

/* ---------- Hours input (estimate / actual) ---------- */

function HoursField({ name, label }: { name: TaskFieldName; label: string }) {
  const { control } = useFormContext<TimeTrackerTaskFormValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>{label}</RequiredLabel>
          <FormControl>
            <Input {...field} value={String(field.value ?? '')} type="text" inputMode="decimal" className={fieldClass} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/* ---------- One "Task details" box ---------- */

function TaskDetailsFields({ index, title, onClose }: { index: number; title: string; onClose: () => void }) {
  const { control, setValue } = useFormContext<TimeTrackerTaskFormValues>();
  const status = useWatch({ control, name: `tasks.${index}.status` });
  const isCompleted = status === 'completed';

  // Actual hours and date only apply to completed tasks, so clear them otherwise
  const handleStatusChange = (value: string) => {
    if (value !== 'completed') {
      setValue(`tasks.${index}.actualHours`, undefined);
      setValue(`tasks.${index}.completedDate`, '');
    }
  };

  return (
    <fieldset className="relative space-y-4 rounded-lg border border-[#464EB8]/20 bg-indigo-50/30 p-4">
      <legend className="px-2 text-sm font-semibold text-[#464EB8]">{title}</legend>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="absolute -top-4 right-3 h-8 w-8 rounded-full bg-white hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={control}
          name={`tasks.${index}.status`}
          label="Task status"
          options={TASK_STATUS_OPTIONS}
          onValueChange={handleStatusChange}
        />
        <SelectField control={control} name={`tasks.${index}.project`} label="Project" placeholder="Select project" options={PROJECT_OPTIONS} />
        <SelectField control={control} name={`tasks.${index}.module`} label="Epic / Module" placeholder="Select epic or module" options={MODULE_OPTIONS} />
        <SelectField control={control} name={`tasks.${index}.task`} label="User story / task" placeholder="Select task type" options={TASK_TYPE_OPTIONS} />

        <FormField
          control={control}
          name={`tasks.${index}.description`}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <RequiredLabel>Description</RequiredLabel>
              <FormControl>
                <Textarea {...field} rows={2} placeholder="Describe the work completed or planned" className={fieldClass} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <HoursField name={`tasks.${index}.estimateHours`} label="Estimate hours" />

        {isCompleted && (
          <>
            <HoursField name={`tasks.${index}.actualHours`} label="Actual hours" />
            <FormField
              control={control}
              name={`tasks.${index}.completedDate`}
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Date</RequiredLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} type="date" max={todayAsDateInput()} className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </fieldset>
  );
}

/* ---------- Dialog ---------- */

interface TaskDialogProps {
  task?: TaskRecord;
  onClose: () => void;
  onSave: (values: TimeTrackerTaskFormValues) => void;
}

export function TaskDialog({ task, onClose, onSave }: TaskDialogProps) {
  const form = useForm<TimeTrackerTaskFormValues>({
    resolver: zodResolver(timeTrackerTaskFormSchema),
    defaultValues: { tasks: [task ? { ...task } : { ...emptyTask }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'tasks' });

  // "Add another task" appears only once the last box is fully filled in
  const tasks = useWatch({ control: form.control, name: 'tasks' });
  const canAddAnotherTask = !task && timeTrackerTaskSchema.safeParse(tasks[tasks.length - 1]).success;

  // Closing the only box closes the dialog; otherwise it just removes that box
  const closeTaskDetails = (index: number) => {
    if (fields.length > 1) remove(index);
    else onClose();
  };

  const submitLabel = task ? 'Save changes' : fields.length > 1 ? 'Save tasks' : 'Save task';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-white" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">{task ? 'Edit task' : 'Add task'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-5 pt-2">
            {fields.map((field, index) => (
              <TaskDetailsFields
                key={field.id}
                index={index}
                title={fields.length > 1 ? `Task ${index + 1}` : 'Task details'}
                onClose={() => closeTaskDetails(index)}
              />
            ))}

            {!task && (canAddAnotherTask ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ ...emptyTask })}
                className="border-[#464EB8]/30 text-[#464EB8] hover:bg-[#464EB8]/5 hover:text-[#464EB8]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add another task
              </Button>
            ) : (
              <p className="text-sm text-gray-500">Fill in all required task details above to add another task.</p>
            ))}

            <DialogFooter className="gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">{submitLabel}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
