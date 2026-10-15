import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { Task, TaskInput, TaskStatus } from '@/types';
import { taskService } from './task-service';

const TASKS_KEY = ['tasks'] as const;

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
  reopened: 'Reopened',
};
const PROJECTS_KEY = ['projects'] as const;
const SPRINTS_KEY = ['sprints'] as const;
const EPICS_KEY = ['epics'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  // The Tasks route is protected, so a signed-in user is always present here
  if (!user) throw new Error('Tasks require a signed-in user');
  return user;
}

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

// Shared mutation wiring: refresh the task list and toast the outcome
function useTaskMutation<TVariables>(
  mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>,
  successMessage: (variables: TVariables) => string,
) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      // Epics are tasks too, so creating, renaming or deleting one changes the epic list
      queryClient.invalidateQueries({ queryKey: EPICS_KEY });
      toast.success(successMessage(variables));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export const useCreateTask = () =>
  useTaskMutation((actor, input: TaskInput) => taskService.create(actor, input), () => 'Task created');

export const useUpdateTask = () =>
  useTaskMutation(
    (actor, { id, input }: { id: string; input: Omit<TaskInput, 'projectId'> }) => taskService.update(actor, id, input),
    () => 'Task updated',
  );

// Optimistic: the card moves immediately (e.g. on a board drop) and rolls back if the server refuses
export function useChangeTaskStatus() {
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
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    },
    onSuccess: (_result, { task, status }) => toast.success(`${task.key} moved to ${TASK_STATUS_LABELS[status]}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
  });
}

export const useDuplicateTask = () =>
  useTaskMutation((actor, task: Task) => taskService.duplicate(actor, task.id), (task) => `${task.key} duplicated`);

export const useDeleteTask = () =>
  useTaskMutation((actor, task: Task) => taskService.remove(actor, task.id), (task) => `${task.key} deleted`);
