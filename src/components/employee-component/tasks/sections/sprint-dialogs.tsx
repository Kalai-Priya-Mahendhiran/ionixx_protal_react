import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, fieldClass } from '@/components/ui/form-fields';
import { sprintSchema, type SprintFormValues } from '@/lib/schemas';
import { cn, toDateInput, todayAsDateInput } from '@/lib/utils';
import { useCompleteSprint, useCreateSprint } from '@/services/apis/tasks/use-tasks';
import type { Project, Sprint, Task } from '@/types';
import { formatShortDate, getDurationDays, parseDateInput } from './task-utils';

const SPRINT_LENGTH_DAYS = 14;

const addDays = (value: string, days: number) => {
  const date = parseDateInput(value);
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

// "IXP Sprint 16" -> "IXP Sprint 17"; first sprint of a project is "<KEY> Sprint 1"
function suggestSprint(project: Project, sprints: Sprint[]): SprintFormValues {
  const projectSprints = sprints.filter((sprint) => sprint.projectId === project.id);
  const highest = projectSprints.reduce((max, sprint) => Math.max(max, Number(/(\d+)\s*$/.exec(sprint.name)?.[1] ?? 0)), 0);
  const lastEnd = projectSprints.reduce((latest, sprint) => (sprint.endDate > latest ? sprint.endDate : latest), '');
  const today = todayAsDateInput();
  const startDate = lastEnd && lastEnd >= today ? addDays(lastEnd, 1) : today;
  return { name: `${project.key} Sprint ${highest + 1}`, goal: '', startDate, endDate: addDays(startDate, SPRINT_LENGTH_DAYS - 1) };
}

/* ---------- Create ---------- */

interface CreateSprintDialogProps {
  project: Project | null;
  sprints: Sprint[];
  onOpenChange: (open: boolean) => void;
}

export function CreateSprintDialog({ project, sprints, onOpenChange }: CreateSprintDialogProps) {
  const createSprint = useCreateSprint();
  const form = useForm<SprintFormValues>({ resolver: zodResolver(sprintSchema) });
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  useEffect(() => {
    if (project) form.reset(suggestSprint(project, sprints));
    // Only when the dialog opens for a project, not on every sprint list refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, form]);

  const onSubmit = (values: SprintFormValues) => {
    if (!project) return;
    createSprint.mutate({ projectId: project.id, ...values }, { onSuccess: () => onOpenChange(false) });
  };

  const duration = startDate && endDate && endDate > startDate ? getDurationDays(startDate, endDate) : null;

  return (
    <Dialog open={!!project} onOpenChange={(next) => !createSprint.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Create sprint</DialogTitle>
          <DialogDescription>
            {project?.name} · sprints default to {SPRINT_LENGTH_DAYS} days. Move tasks in from the backlog after creating it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Sprint name</RequiredLabel>
                  <FormControl>
                    <Input {...field} className={fieldClass} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>Start date</RequiredLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        className={fieldClass}
                        onChange={(event) => {
                          field.onChange(event);
                          // Keep the sprint two weeks long when the start moves
                          if (event.target.value) form.setValue('endDate', addDays(event.target.value, SPRINT_LENGTH_DAYS - 1), { shouldValidate: true });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>End date</RequiredLabel>
                    <FormControl>
                      <Input {...field} type="date" min={startDate || undefined} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {duration && <p className="text-xs font-medium text-indigo-700">{duration} days</p>}
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Sprint goal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What should this sprint achieve?" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createSprint.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSprint.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {createSprint.isPending ? 'Creating…' : 'Create sprint'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Complete ---------- */

interface CompleteSprintDialogProps {
  sprint: Sprint | null;
  // Top-level tasks in the sprint
  sprintTasks: Task[];
  plannedSprints: Sprint[];
  onOpenChange: (open: boolean) => void;
}

const BACKLOG = 'backlog';

export function CompleteSprintDialog({ sprint, sprintTasks, plannedSprints, onOpenChange }: CompleteSprintDialogProps) {
  const completeSprint = useCompleteSprint();
  const [target, setTarget] = useState(BACKLOG);

  // Default to the next planned sprint when there is one
  useEffect(() => {
    if (sprint) setTarget(plannedSprints[0]?.id ?? BACKLOG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprint]);

  const done = sprintTasks.filter((task) => task.status === 'done').length;
  const unfinished = sprintTasks.length - done;
  const options = [...plannedSprints.map((item) => ({ value: item.id, label: item.name, hint: `${formatShortDate(item.startDate)} – ${formatShortDate(item.endDate)}` })), { value: BACKLOG, label: 'Backlog', hint: 'Plan them later' }];

  const submit = () => {
    if (!sprint) return;
    completeSprint.mutate({ sprint, moveToSprintId: target === BACKLOG ? null : target }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={!!sprint} onOpenChange={(next) => !completeSprint.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Complete {sprint?.name}</DialogTitle>
          <DialogDescription>{sprint?.goal ? `Goal: ${sprint.goal}` : 'Review the sprint and decide what happens to unfinished work.'}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-50 p-3">
            <p className="flex items-center gap-1.5 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Done
            </p>
            <p className="text-2xl font-bold text-green-900">{done}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-sm text-amber-800">
              <CircleDashed className="h-4 w-4" />
              Unfinished
            </p>
            <p className="text-2xl font-bold text-amber-900">{unfinished}</p>
          </div>
        </div>

        {unfinished > 0 ? (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-gray-700">Move the {unfinished} unfinished {unfinished === 1 ? 'task' : 'tasks'} to</legend>
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm',
                  target === option.value ? 'border-[#464EB8] bg-indigo-50' : 'border-gray-200 hover:bg-gray-50',
                )}
              >
                <input
                  type="radio"
                  name="complete-sprint-target"
                  value={option.value}
                  checked={target === option.value}
                  onChange={() => setTarget(option.value)}
                  className="accent-[#464EB8]"
                />
                <span className="flex-1 font-medium text-gray-900">{option.label}</span>
                <span className="text-xs text-gray-500">{option.hint}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="text-sm text-green-700">Everything in this sprint is done. 🎉</p>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={completeSprint.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={completeSprint.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            {completeSprint.isPending ? 'Completing…' : 'Complete sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
