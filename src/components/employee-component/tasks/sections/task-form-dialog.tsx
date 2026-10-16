import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CalendarRange, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass, type Option } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { can, canCreateTask, getAssignableUsers } from '@/lib/permissions/task-permissions';
import { TASK_FIELD_NONE, TASK_ISSUE_TYPES, TASK_PRIORITIES, taskSchema, type TaskFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { useCreateTask, useEpics, useSprints, useUpdateTask } from '@/services/apis/tasks/use-tasks';
import type { Project, SprintStatus, Task, TaskAttachment } from '@/types';
import { TaskAttachmentsField } from './task-attachments-field';
import { getConfiguredLabels, isTypeEnabled } from '@/lib/workflow';
import { OnLeaveBanner } from './leave-warning';
import { TaskTypeGlyph, UserChip } from './task-badges';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from './task-config';
import { formatShortDate, getDurationDays, parseLabels } from './task-utils';

const PRIORITY_OPTIONS: Option[] = TASK_PRIORITIES.map((value) => {
  const { label, icon: Icon, className } = TASK_PRIORITY_CONFIG[value];
  return { value, label, icon: <Icon className={cn('h-4 w-4', className)} /> };
});

const SPRINT_STATUS_META: Record<SprintStatus, { label: string; dotClass: string }> = {
  active: { label: 'Active', dotClass: 'bg-green-500' },
  planned: { label: 'Planned', dotClass: 'bg-blue-400' },
  completed: { label: 'Completed', dotClass: 'bg-gray-400' },
};

const toOptional = (value: string) => (value && value !== TASK_FIELD_NONE ? value : undefined);

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{title}</h3>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex h-10 items-center gap-2 rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
        {children}
      </div>
    </div>
  );
}

interface TaskFormDialogProps {
  open: boolean;
  // Present when editing; absent when creating
  task?: Task;
  projects: Project[];
  onOpenChange: (open: boolean) => void;
}

export function TaskFormDialog({ open, task, projects, onOpenChange }: TaskFormDialogProps) {
  const { user } = useAuth();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: sprints = [] } = useSprints();
  const { data: epics = [] } = useEpics();
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [createAnother, setCreateAnother] = useState(false);

  const isSaving = createTask.isPending || updateTask.isPending;
  const showAssignee = can(user, 'task.assign');
  const defaultProject = projects.find((project) => user && project.memberIds.includes(user.id)) ?? projects[0];

  const form = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema) });
  const [projectId, type, sprintId, startDate, dueDate, assigneeId] = useWatch({
    control: form.control,
    name: ['projectId', 'type', 'sprintId', 'startDate', 'dueDate', 'assigneeId'],
  });

  // Reset whenever the dialog opens, so Create starts blank and Edit is pre-filled
  useEffect(() => {
    if (!open) return;
    setAttachments(task?.attachments ?? []);
    form.reset(
      task
        ? {
            title: task.title,
            description: task.description,
            projectId: task.projectId,
            type: task.type,
            priority: task.priority,
            assigneeId: task.assigneeId,
            epicId: task.epicId ?? TASK_FIELD_NONE,
            sprintId: task.sprintId ?? TASK_FIELD_NONE,
            startDate: task.startDate ?? '',
            dueDate: task.dueDate,
            estimateHours: task.estimateHours?.toString() ?? '',
            labels: task.labels.join(', '),
          }
        : {
            title: '',
            description: '',
            projectId: defaultProject?.id ?? '',
            type: defaultProject?.defaultIssueType ?? 'task',
            priority: 'medium',
            assigneeId: user?.id ?? '',
            epicId: TASK_FIELD_NONE,
            sprintId: TASK_FIELD_NONE,
            startDate: '',
            dueDate: '',
            estimateHours: '',
            labels: '',
          },
    );
  }, [open, task, defaultProject, user, form]);

  /* ---------- Options ---------- */

  const projectOptions: Option[] = projects.map((project) => ({
    value: project.id,
    label: project.name,
    icon: <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">{project.key}</span>,
  }));

  // Sub-tasks are created from their parent task, so they're only offered when editing one
  const typeOptions: Option[] = TASK_ISSUE_TYPES.filter((value) => value === task?.type || (value !== 'sub-task' && isTypeEnabled(value))).map((value) => ({
    value,
    label: TASK_TYPE_CONFIG[value].label,
    icon: <TaskTypeGlyph type={value} />,
  }));

  const projectSprints = sprints.filter((sprint) => sprint.projectId === projectId);
  const selectedSprint = projectSprints.find((sprint) => sprint.id === sprintId);
  const sprintOptions: Option[] = [
    { value: TASK_FIELD_NONE, label: 'Backlog (no sprint)' },
    // Completed sprints only stay listed for a task that's already in one
    ...projectSprints
      .filter((sprint) => sprint.status !== 'completed' || sprint.id === task?.sprintId)
      .map((sprint) => ({
        value: sprint.id,
        label: sprint.name,
        hint: `${SPRINT_STATUS_META[sprint.status].label} · ${formatShortDate(sprint.startDate)} – ${formatShortDate(sprint.endDate)}`,
        icon: <span className={cn('h-2 w-2 rounded-full', SPRINT_STATUS_META[sprint.status].dotClass)} />,
      })),
  ];

  const epicOptions: Option[] = [
    { value: TASK_FIELD_NONE, label: 'No epic' },
    ...epics
      .filter((epic) => epic.projectId === projectId && epic.id !== task?.id)
      .map((epic) => ({ value: epic.id, label: `${epic.key} · ${epic.title}`, icon: <TaskTypeGlyph type="epic" /> })),
  ];

  const assigneeOptions: Option[] = useMemo(() => {
    const users = getAssignableUsers(user);
    // Keep the current assignee selectable even if they're outside the user's assignable list
    const current = task && !users.some((member) => member.id === task.assigneeId) ? getUserById(task.assigneeId) : undefined;
    return [...(current ? [current] : []), ...users].map((member) => ({
      value: member.id,
      label: member.id === user?.id ? `${member.name} (me)` : member.name,
      hint: member.designation,
    }));
  }, [user, task]);

  /* ---------- Field interactions ---------- */

  const handleProjectChange = (nextProjectId: string) => {
    const project = projects.find((item) => item.id === nextProjectId);
    if (project) form.setValue('type', project.defaultIssueType);
    // Epics and sprints belong to a project
    form.setValue('epicId', TASK_FIELD_NONE);
    form.setValue('sprintId', TASK_FIELD_NONE);
  };

  const handleTypeChange = (nextType: string) => {
    if (nextType === 'epic') form.setValue('epicId', TASK_FIELD_NONE);
  };

  const applySprintDates = () => {
    if (!selectedSprint) return;
    form.setValue('startDate', selectedSprint.startDate, { shouldValidate: true });
    form.setValue('dueDate', selectedSprint.endDate, { shouldValidate: true });
  };

  const duration = startDate && dueDate && dueDate >= startDate ? getDurationDays(startDate, dueDate) : null;
  const dueAfterSprint = selectedSprint && dueDate && dueDate > selectedSprint.endDate;

  /* ---------- Submit ---------- */

  const onSubmit = (values: TaskFormValues) => {
    const changes = {
      type: values.type,
      title: values.title,
      description: values.description,
      priority: values.priority,
      assigneeId: values.assigneeId,
      startDate: values.startDate || undefined,
      dueDate: values.dueDate,
      labels: parseLabels(values.labels),
      epicId: values.type === 'epic' ? undefined : toOptional(values.epicId),
      sprintId: toOptional(values.sprintId),
      estimateHours: values.estimateHours ? Number(values.estimateHours) : undefined,
      attachments,
    };

    const allowed = task ? can(user, 'task.edit', { ...task, ...changes }) : canCreateTask(user, changes);
    if (!allowed) {
      form.setError('root', { message: "You don't have permission to save a task with this type and assignee." });
      return;
    }

    if (task) {
      updateTask.mutate({ id: task.id, input: changes }, { onSuccess: () => onOpenChange(false) });
      return;
    }

    createTask.mutate(
      { ...changes, projectId: values.projectId },
      {
        onSuccess: () => {
          if (!createAnother) {
            onOpenChange(false);
            return;
          }
          // Keep project, type, planning and people; clear what's unique to each task
          form.reset({ ...values, title: '', description: '', estimateHours: '', labels: '' });
          setAttachments([]);
          form.setFocus('title');
        },
      },
    );
  };

  const project = projects.find((item) => item.id === projectId);

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-indigo-100 px-6 py-4 pr-12">
          <DialogTitle className="text-xl text-gray-900">{task ? `Edit ${task.key}` : 'Create task'}</DialogTitle>
          <DialogDescription>
            {task ? task.title : (
              <>
                Fields marked <span className="text-red-500">*</span> are required.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="ionixx-scrollbar flex-1 space-y-7 overflow-y-auto px-6 py-5">
              <FormSection title="Project & type">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {task ? (
                    // Task keys belong to a project, so moving projects is a separate action
                    <ReadOnlyField label="Project">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                      {project ? `${project.name} (${project.key})` : '—'}
                    </ReadOnlyField>
                  ) : (
                    <SelectField
                      control={form.control}
                      name="projectId"
                      label="Project"
                      options={projectOptions}
                      placeholder="Select project"
                      onValueChange={handleProjectChange}
                    />
                  )}
                  <SelectField
                    control={form.control}
                    name="type"
                    label="Type"
                    options={typeOptions}
                    placeholder="Select type"
                    onValueChange={handleTypeChange}
                  />
                </div>
              </FormSection>

              <FormSection title="Details">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <RequiredLabel>Title</RequiredLabel>
                      <FormControl>
                        <Input {...field} placeholder="Short summary of the work" className={fieldClass} autoFocus />
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
                      <FormLabel className="text-gray-700">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder="Context, steps to reproduce or acceptance criteria"
                          className={fieldClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection title="Planning">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {type !== 'epic' && (
                    <SelectField
                      control={form.control}
                      name="epicId"
                      label="Epic"
                      options={epicOptions}
                      placeholder="No epic"
                      required={false}
                    />
                  )}
                  <div className="space-y-1.5">
                    <SelectField
                      control={form.control}
                      name="sprintId"
                      label="Sprint"
                      options={sprintOptions}
                      placeholder="Backlog (no sprint)"
                      required={false}
                    />
                    {projectSprints.length === 0 ? (
                      <p className="text-xs text-gray-500">This project doesn't run sprints yet.</p>
                    ) : selectedSprint ? (
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                        <span>
                          {formatShortDate(selectedSprint.startDate)} – {formatShortDate(selectedSprint.endDate)}
                          {selectedSprint.goal && ` · ${selectedSprint.goal}`}
                        </span>
                        <button type="button" onClick={applySprintDates} className="font-medium text-[#464EB8] hover:underline">
                          Use sprint dates
                        </button>
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Start date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" max={dueDate || undefined} className={fieldClass} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <RequiredLabel>Due date</RequiredLabel>
                          <FormControl>
                            <Input {...field} type="date" min={startDate || undefined} className={fieldClass} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <OnLeaveBanner userId={assigneeId || user?.id || ''} date={dueDate} className="mt-3" />
                  {(duration || dueAfterSprint) && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      {duration && (
                        <span className="inline-flex items-center gap-1 font-medium text-indigo-700">
                          <CalendarRange className="h-3.5 w-3.5" />
                          Duration: {duration} {duration === 1 ? 'day' : 'days'}
                        </span>
                      )}
                      {dueAfterSprint && (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Due after {selectedSprint.name} ends ({formatShortDate(selectedSprint.endDate)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="estimateHours"
                  render={({ field }) => (
                    <FormItem className="sm:w-1/2 sm:pr-2">
                      <FormLabel className="text-gray-700">Estimate (hours)</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" placeholder="e.g. 8" className={fieldClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              <FormSection title="People & priority">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {showAssignee ? (
                    <div className="space-y-1.5">
                      <SelectField
                        control={form.control}
                        name="assigneeId"
                        label="Assignee"
                        options={assigneeOptions}
                        placeholder="Select assignee"
                      />
                      {user && assigneeId !== user.id && (
                        <button
                          type="button"
                          onClick={() => form.setValue('assigneeId', user.id, { shouldValidate: true })}
                          className="text-xs font-medium text-[#464EB8] hover:underline"
                        >
                          Assign to me
                        </button>
                      )}
                    </div>
                  ) : (
                    <ReadOnlyField label="Assignee">
                      <UserChip userId={assigneeId || user?.id || ''} />
                    </ReadOnlyField>
                  )}
                  <ReadOnlyField label="Reporter">
                    <UserChip userId={task?.reporterId ?? user?.id ?? ''} />
                  </ReadOnlyField>
                  <SelectField control={form.control} name="priority" label="Priority" options={PRIORITY_OPTIONS} placeholder="Select priority" />
                  <FormField
                    control={form.control}
                    name="labels"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Labels</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Comma separated, e.g. frontend, release" list="task-label-suggestions" className={fieldClass} />
                        </FormControl>
                        {/* Labels configured in Settings → Types & Labels */}
                        <datalist id="task-label-suggestions">
                          {getConfiguredLabels().map((label) => (
                            <option key={label} value={label} />
                          ))}
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>

              <FormSection title="Attachments">
                <TaskAttachmentsField value={attachments} onChange={setAttachments} taskId={task?.id} />
              </FormSection>

              {form.formState.errors.root && (
                <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-indigo-100 bg-gray-50/60 px-6 py-4">
              {task ? (
                <span />
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={createAnother}
                    onChange={(event) => setCreateAnother(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-[#464EB8]"
                  />
                  Create another
                </label>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                  {isSaving ? 'Saving…' : task ? 'Save changes' : 'Create'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
