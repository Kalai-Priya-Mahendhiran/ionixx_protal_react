import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { employeeService, type AddEmployeeInput } from './employee-service';

export const EMPLOYEES_KEY = ['employees'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Employee records require a signed-in user');
  return user;
}

export function useEmployees() {
  const actor = useActor();
  return useQuery({ queryKey: [...EMPLOYEES_KEY, actor.id], queryFn: () => employeeService.list(actor) });
}

// People changes ripple everywhere (org chart, pickers, user management), so everything refreshes
export function useAddEmployee() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddEmployeeInput) => employeeService.add(actor, input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries();
      toast.success(`${input.name.trim()} added · they'll get a sign-in invitation`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useSetEmployeeActive() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean; name: string }) => employeeService.setActive(actor, userId, active),
    onSuccess: (_, { active, name }) => {
      queryClient.invalidateQueries();
      toast.success(active ? `${name} reactivated` : `${name} marked inactive · their access is switched off`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}
