import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { Task, TaskAttachment, TaskInput, TaskStatus } from '@/types';
import { FILES_KEY } from '../files/use-files';
import { NOTIFICATIONS_KEY } from '../notifications/use-notifications';
import { TIME_ENTRIES_KEY } from '../time-tracker/use-time-entries';
import { taskService, type LogWorkInput } from './task-service';

// Detail queries (comments, history, work log) live under this key too, so any task change refreshes them
const TASKS_KEY = ['tasks'] as const;
const PROJECTS_KEY = ['projects'] as const;
const SPRINTS_KEY = ['sprints'] as const;
const EPICS_KEY = ['epics'] as const;

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
  reopened: 'Reopened',
};

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

function useActor(): PermissionUser {
  const { user } = useAuth();
  // The Tasks route is protected, so a signed-in user is always present here
  if (!user) throw new Error('Tasks require a signed-in user');
  return user;
}

/* ---------- Queries ---------- */

export function useTasks() {
  const actor = useActor();
  return useQuery({
    queryKey: [...TASKS_KEY, actor.id],
    queryFn: () => taskService.list(actor),
  });
}

export function useProjects() {
  return useQuery({ queryKey: PROJECTS_KEY, queryFn: () => taskService.listProjects() });
}

export function useSprints() {
  const actor = useActor();
  return useQuery({ queryKey: [...SPRINTS_KEY, actor.id], queryFn: () => taskService.listSprints(actor) });
}

export function useEpics() {
  const actor = useActor();
  return useQuery({ queryKey: [...EPICS_KEY, actor.id], queryFn: () => taskService.listEpics(actor) });
}

export function useTaskComments(taskId: string) {
  const actor = useActor();
  return useQuery({ queryKey: [...TASKS_KEY, 'detail', taskId, 'comments'], queryFn: () => taskService.listComments(actor, taskId) });
}

export function useTaskActivity(taskId: string) {
  const actor = useActor();
  return useQuery({ queryKey: [...TASKS_KEY, 'detail', taskId, 'activity'], queryFn: () => taskService.listActivity(actor, taskId) });
}

export function useTaskWorkLogs(taskId: string) {
  const actor = useActor();
  return useQuery({ queryKey: [...TASKS_KEY, 'detail', taskId, 'worklogs'], queryFn: () => taskService.listWorkLogs(actor, taskId) });
}

/* ---------- Mutations ---------- */

// Shared mutation wiring: refresh everything a task change can affect and toast the outcome
function useTaskMutation<TVariables, TResult = unknown>(
  mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<TResult>,
  successMessage: ((variables: TVariables) => string) | null,
  extraKeys: readonly (readonly string[])[] = [],
) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (_result, variables) => {
      // Epics are tasks too; notifications are raised by task changes
      [TASKS_KEY, EPICS_KEY, NOTIFICATIONS_KEY, ...extraKeys].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (successMessage) toast.success(successMessage(variables));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export const useCreateTask = () =>
  useTaskMutation((actor, input: TaskInput) => taskService.create(actor, input), () => 'Task created', [FILES_KEY]);

export const useUpdateTask = () =>
  useTaskMutation(
    (actor, { id, input }: { id: string; input: Omit<TaskInput, 'projectId'> }) => taskService.update(actor, id, input),
    () => 'Task updated',
    [FILES_KEY],
  );

// Optimistic: the card moves immediately (e.g. on a board drop) and rolls back if the server refuses.
// `silent` skips the success toast, e.g. for ticking sub-tasks off a checklist.
export function useChangeTaskStatus({ silent = false }: { silent?: boolean } = {}) {
  const actor = useActor();
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, actor.id];

  return useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) => taskService.changeStatus(actor, task.id, status),
    onMutate: async ({ task, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (tasks) => tasks?.map((item) => (item.id === task.id ? { ...item, status } : item)));
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_result, { task, status }) => {
      if (!silent) toast.success(`${task.key} moved to ${TASK_STATUS_LABELS[status]}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export const useDuplicateTask = () =>
  useTaskMutation((actor, task: Task) => taskService.duplicate(actor, task.id), (task) => `${task.key} duplicated`);

export const useDeleteTask = () =>
  useTaskMutation((actor, task: Task) => taskService.remove(actor, task.id), (task) => `${task.key} deleted`);

export const useCreateSubtask = () =>
  useTaskMutation(
    (actor, { parent, title, assigneeId }: { parent: Task; title: string; assigneeId: string }) =>
      taskService.createSubtask(actor, parent.id, { title, assigneeId }),
    null,
  );

export const useSetWatching = () =>
  useTaskMutation(
    (actor, { task, watching }: { task: Task; watching: boolean }) => taskService.setWatching(actor, task.id, watching),
    ({ task, watching }) => (watching ? `You're watching ${task.key}` : `You stopped watching ${task.key}`),
  );

export const useSetBlocked = () =>
  useTaskMutation(
    (actor, { task, blocked, reason }: { task: Task; blocked: boolean; reason?: string }) =>
      taskService.setBlocked(actor, task.id, blocked, reason),
    ({ task, blocked }) => (blocked ? `${task.key} flagged as blocked — your manager has been notified` : `${task.key} unblocked`),
  );

export const useAddAttachments = () =>
  useTaskMutation(
    (actor, { task, attachments }: { task: Task; attachments: TaskAttachment[] }) => taskService.addAttachments(actor, task.id, attachments),
    ({ attachments }) => (attachments.length === 1 ? `${attachments[0].name} attached` : `${attachments.length} files attached`),
    [FILES_KEY],
  );

export const useRemoveAttachment = () =>
  useTaskMutation(
    (actor, { task, attachmentId }: { task: Task; attachmentId: string }) => taskService.removeAttachment(actor, task.id, attachmentId),
    () => 'Attachment removed',
  );

export const useAddComment = () =>
  useTaskMutation(
    (actor, { task, body, mentionIds }: { task: Task; body: string; mentionIds: string[] }) =>
      taskService.addComment(actor, task.id, body, mentionIds),
    null,
  );

export const useLogWork = () =>
  useTaskMutation(
    (actor, { task, input }: { task: Task; input: LogWorkInput }) => taskService.logWork(actor, task.id, input),
    ({ task, input }) => `${input.hours}h logged on ${task.key} and added to your Time Tracker`,
    [TIME_ENTRIES_KEY],
  );

/* ---------- Manager tools ---------- */

export const useApproveTask = () =>
  useTaskMutation((actor, task: Task) => taskService.approve(actor, task.id), (task) => `${task.key} approved and moved to Done`);

export const useSendBackTask = () =>
  useTaskMutation(
    (actor, { task, reason }: { task: Task; reason: string }) => taskService.sendBack(actor, task.id, reason),
    ({ task }) => `${task.key} sent back to In Progress`,
  );

// Optimistic update shared by drag-and-drop moves, rolled back if the server refuses
function useOptimisticTaskMove<TVariables extends { task: Task }>(
  mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>,
  applyChange: (task: Task, variables: TVariables) => Task,
  successMessage: (variables: TVariables) => string,
  extraKeys: readonly (readonly string[])[] = [],
) {
  const actor = useActor();
  const queryClient = useQueryClient();
  const queryKey = [...TASKS_KEY, actor.id];

  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Task[]>(queryKey);
      queryClient.setQueryData<Task[]>(queryKey, (tasks) =>
        tasks?.map((item) => (item.id === variables.task.id ? applyChange(item, variables) : item)),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_result, variables) => toast.success(successMessage(variables)),
    onSettled: () => [TASKS_KEY, NOTIFICATIONS_KEY, ...extraKeys].forEach((key) => queryClient.invalidateQueries({ queryKey: key })),
  });
}

export const useReassignTask = () =>
  useOptimisticTaskMove(
    (actor, { task, assigneeId, status }: { task: Task; assigneeId: string; assigneeName: string; status?: TaskStatus }) =>
      taskService.reassign(actor, task.id, assigneeId, status),
    (task, { assigneeId, status }) => ({ ...task, assigneeId, status: status ?? task.status }),
    ({ task, assigneeName }) => `${task.key} assigned to ${assigneeName}`,
  );

export const useMoveToSprint = () =>
  useOptimisticTaskMove(
    (actor, { task, sprintId }: { task: Task; sprintId: string | null; targetName: string }) => taskService.moveToSprint(actor, task.id, sprintId),
    (task, { sprintId }) => ({ ...task, sprintId: sprintId ?? undefined }),
    ({ task, targetName }) => `${task.key} moved to ${targetName}`,
    [SPRINTS_KEY],
  );

export const useCreateSprint = () =>
  useTaskMutation(
    (actor, input: Parameters<typeof taskService.createSprint>[1]) => taskService.createSprint(actor, input),
    (input) => `${input.name} created`,
    [SPRINTS_KEY],
  );

export const useStartSprint = () =>
  useTaskMutation(
    (actor, sprint: { id: string; name: string }) => taskService.startSprint(actor, sprint.id),
    (sprint) => `${sprint.name} started`,
    [SPRINTS_KEY],
  );

export const useCompleteSprint = () =>
  useTaskMutation(
    (actor, { sprint, moveToSprintId }: { sprint: { id: string; name: string }; moveToSprintId: string | null }) =>
      taskService.completeSprint(actor, sprint.id, moveToSprintId),
    ({ sprint }) => `${sprint.name} completed`,
    [SPRINTS_KEY],
  );

/* ---------- HR templates ---------- */

export const useApplyTemplate = () =>
  useTaskMutation(
    (actor, { template, subjectId, anchorDate }: { template: { id: string; name: string }; subjectId: string; anchorDate: string }) =>
      taskService.applyTemplate(actor, template.id, subjectId, anchorDate),
    ({ template }) => `Checklist created from "${template.name}"`,
  );
