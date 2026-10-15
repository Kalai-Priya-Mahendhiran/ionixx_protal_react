import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { fileService } from './file-service';

export const FILES_KEY = ['files'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Files require a signed-in user');
  return user;
}

export function useFiles() {
  const actor = useActor();
  return useQuery({ queryKey: [...FILES_KEY, actor.id], queryFn: () => fileService.list(actor) });
}

// Errors are returned to the caller, which shows them next to the upload area
export function useUploadFiles() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ files, category, taskId }: { files: globalThis.File[]; category: string; taskId?: string }) =>
      Promise.all(files.map((file) => fileService.upload(actor, file, { category, taskId }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: FILES_KEY }),
  });
}
