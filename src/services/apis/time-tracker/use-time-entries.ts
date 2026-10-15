import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { timeEntryService, type TimeEntryInput } from './time-entry-service';

export const TIME_ENTRIES_KEY = ['time-entries'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Time entries require a signed-in user');
  return user;
}

export function useTimeEntries() {
  const actor = useActor();
  return useQuery({ queryKey: [...TIME_ENTRIES_KEY, actor.id], queryFn: () => timeEntryService.list(actor) });
}

function useTimeEntryMutation<TVariables>(mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TIME_ENTRIES_KEY }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export const useCreateTimeEntry = () =>
  useTimeEntryMutation((actor, input: TimeEntryInput) => timeEntryService.create(actor, input));

export const useUpdateTimeEntry = () =>
  useTimeEntryMutation((actor, { id, changes }: { id: string; changes: Partial<TimeEntryInput> }) =>
    timeEntryService.update(actor, id, changes),
  );

export const useDeleteTimeEntry = () => useTimeEntryMutation((actor, id: string) => timeEntryService.remove(actor, id));
