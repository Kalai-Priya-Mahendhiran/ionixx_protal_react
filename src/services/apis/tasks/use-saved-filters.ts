import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { savedFilterService, type SavedFilterInput } from './saved-filter-service';

export const SAVED_FILTERS_KEY = ['saved-filters'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Saved filters require a signed-in user');
  return user;
}

export function useSavedFilters() {
  const actor = useActor();
  return useQuery({ queryKey: [...SAVED_FILTERS_KEY, actor.id], queryFn: () => savedFilterService.list(actor) });
}

export function useSaveFilter() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavedFilterInput) => savedFilterService.save(actor, input),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: SAVED_FILTERS_KEY });
      toast.success(`Saved "${saved.name}"`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useDeleteSavedFilter() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedFilterService.remove(actor, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SAVED_FILTERS_KEY }),
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}
