import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { approvalQueue, type ApprovalDecision, type ApprovalItem } from './approval-queue';

export const APPROVALS_KEY = ['approvals'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Approvals require a signed-in user');
  return user;
}

export function useApprovalQueue() {
  const actor = useActor();
  return useQuery({ queryKey: [...APPROVALS_KEY, actor.id], queryFn: () => approvalQueue.list(actor) });
}

// A decision changes leave balances, calendars, absences on tasks and notifications, so everything refreshes
export function useDecideApproval() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, decision }: { item: ApprovalItem; decision: ApprovalDecision }) => approvalQueue.decide(actor, item, decision),
    onSuccess: (_, { item, decision }) => {
      queryClient.invalidateQueries();
      toast.success(`${decision === 'approved' ? 'Approved' : 'Rejected'} ${item.requesterName}'s ${item.typeLabel.toLowerCase()} · they've been notified`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}
