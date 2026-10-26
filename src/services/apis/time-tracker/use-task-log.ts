import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TaskRecord } from '@/components/common-component/time-tracker/sections/task-form';
import { useAuth } from '@/context/auth-context';
import { NON_PROJECT_TIME, PROJECTS } from '@/lib/sample-data/time-tracker-sample-data';
import { useProjects } from '../tasks/use-tasks';
import { taskLogService } from './task-log-service';

export const TASK_LOG_KEY = ['time-tracker', 'task-log'] as const;

export function useTaskLog() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...TASK_LOG_KEY, user?.id], queryFn: () => taskLogService.list(user!), enabled: !!user });
}

function useTaskLogMutation<TVariables>(run: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASK_LOG_KEY }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useAddTaskLog() {
  const { user } = useAuth();
  return useTaskLogMutation((tasks: Omit<TaskRecord, 'id'>[]) => taskLogService.create(user!, tasks));
}

export function useUpdateTaskLog() {
  const { user } = useAuth();
  return useTaskLogMutation(({ id, changes }: { id: string; changes: Partial<Omit<TaskRecord, 'id'>> }) => taskLogService.update(user!, id, changes));
}

export function useDeleteTaskLog() {
  const { user } = useAuth();
  return useTaskLogMutation((id: string) => taskLogService.remove(user!, id));
}

// Projects to log time against: the Tasks module's projects (live, so new ones appear) plus non-project time
export function useProjectNames(): string[] {
  const { data: projects } = useProjects();
  if (!projects) return PROJECTS;
  return [...projects.map((project) => project.name), NON_PROJECT_TIME];
}
