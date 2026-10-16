import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/lib/mock-users';
import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import type { Project } from '@/types';
import { userAccessService, type InviteInput } from './user-access-service';

export const USERS_KEY = ['users'] as const;

const plural = (count: number, noun: string, rest: string) => `${count} ${noun}${count === 1 ? '' : 's'} ${rest}`;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('User Management requires a signed-in user');
  return user;
}

export function useUserAccounts() {
  const actor = useActor();
  return useQuery({ queryKey: [...USERS_KEY, actor.id], queryFn: () => userAccessService.list(actor), enabled: can(actor, 'user.manage') });
}

export function useOpenWork(userId: string | undefined) {
  const actor = useActor();
  return useQuery({ queryKey: [...USERS_KEY, 'open-work', userId], queryFn: () => userAccessService.getOpenWork(actor, userId!), enabled: !!userId });
}

// Access changes ripple everywhere (pickers, projects, tasks, the queue), so everything refreshes
function useUserMutation<TVariables, TResult>(mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<TResult>, successMessage?: (result: TResult, variables: TVariables) => string) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries();
      if (successMessage) toast.success(successMessage(result, variables));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export const useInviteUser = () => useUserMutation((actor, input: InviteInput) => userAccessService.invite(actor, input), (account) => `Invitation sent to ${account.email}`);

export const useActivateUser = () => useUserMutation((actor, userId: string) => userAccessService.activate(actor, userId), (account) => `${account.name} can sign in again`);

export const useDeactivateUser = () =>
  useUserMutation(
    (actor, { userId, reassignToId }: { userId: string; reassignToId?: string }) => userAccessService.deactivate(actor, userId, reassignToId),
    (result) =>
      ['Account deactivated', result.reassigned.length && plural(result.reassigned.length, 'task', 'reassigned'), result.releasedRequests.length && plural(result.releasedRequests.length, 'request', 'back in the queue')]
        .filter(Boolean)
        .join(' · '),
  );

export const useSetUserRole = () =>
  useUserMutation((actor, { userId, role }: { userId: string; role: UserRole }) => userAccessService.setRole(actor, userId, role), (account) => `${account.name}'s role changes at their next sign-in`);

export const useSetModuleAccess = () =>
  useUserMutation((actor, { userId, path, allowed }: { userId: string; path: string; allowed: boolean }) => userAccessService.setModuleAccess(actor, userId, path, allowed));

export const useSetProjectMembership = () =>
  useUserMutation(
    (actor, { userId, project, member }: { userId: string; project: Project; member: boolean }) => userAccessService.setProjectMembership(actor, userId, project, member),
    (project, { member }) => (member ? `Added to ${project.name}` : `Removed from ${project.name}`),
  );

export const useResetPassword = () => useUserMutation((actor, userId: string) => userAccessService.resetPassword(actor, userId), (email) => `Password reset link sent to ${email}`);
