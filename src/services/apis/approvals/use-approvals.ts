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

// Several requests at once (bulk approve / reject): each is decided on its own, so one refusal doesn't stop the rest
export function useDecideApprovals() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, decision, comment = '' }: { items: ApprovalItem[]; decision: ApprovalDecision; comment?: string }) => {
      const failed: { item: ApprovalItem; reason: string }[] = [];
      for (const item of items) {
        try {
          await approvalQueue.decide(actor, item, decision, comment);
        } catch (error) {
          failed.push({ item, reason: error instanceof Error ? error.message : 'Something went wrong' });
        }
      }
      return { done: items.length - failed.length, failed };
    },
    onSuccess: ({ done, failed }, { decision }) => {
      queryClient.invalidateQueries();
      if (done) toast.success(`${decision === 'approved' ? 'Approved' : 'Rejected'} ${done} request${done === 1 ? '' : 's'} · everyone has been notified`);
      if (failed.length) toast.error(`${failed.length} couldn't be ${decision}: ${failed.map((entry) => `${entry.item.requesterName} (${entry.reason})`).join('; ')}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

// A decision changes leave balances, calendars, absences on tasks and notifications, so everything refreshes
export function useDecideApproval() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ item, decision, comment = '' }: { item: ApprovalItem; decision: ApprovalDecision; comment?: string }) => approvalQueue.decide(actor, item, decision, comment),
    onSuccess: (_, { item, decision }) => {
      queryClient.invalidateQueries();
      toast.success(`${decision === 'approved' ? 'Approved' : 'Rejected'} ${item.requesterName}'s ${item.typeLabel.toLowerCase()} · they've been notified`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}
