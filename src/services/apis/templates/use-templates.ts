import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { templateService, type TaskTemplateInput } from './template-service';

export const TEMPLATES_KEY = ['task-templates'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Templates require a signed-in user');
  return user;
}

export function useTaskTemplates() {
  const actor = useActor();
  return useQuery({
    queryKey: [...TEMPLATES_KEY, actor.id],
    queryFn: () => templateService.list(actor),
    enabled: can(actor, 'template.manage'),
  });
}

function useTemplateMutation<TVariables>(
  mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>,
  successMessage: (variables: TVariables) => string,
) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATES_KEY });
      toast.success(successMessage(variables));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export const useCreateTemplate = () =>
  useTemplateMutation((actor, input: TaskTemplateInput) => templateService.create(actor, input), (input) => `"${input.name}" created`);

export const useUpdateTemplate = () =>
  useTemplateMutation(
    (actor, { id, input }: { id: string; input: TaskTemplateInput }) => templateService.update(actor, id, input),
    ({ input }) => `"${input.name}" saved`,
  );

export const useDeleteTemplate = () =>
  useTemplateMutation((actor, template: { id: string; name: string }) => templateService.remove(actor, template.id), (template) => `"${template.name}" deleted`);
