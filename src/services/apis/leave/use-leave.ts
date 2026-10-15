import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { LeaveAbsence } from '@/types';
import { leaveService, type LeaveRequestInput } from './leave-service';

export const LEAVE_KEY = ['leave'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Leave requires a signed-in user');
  return user;
}

export function useLeaveRequests() {
  const actor = useActor();
  return useQuery({ queryKey: [...LEAVE_KEY, 'requests', actor.id], queryFn: () => leaveService.list(actor) });
}

export function useApplyLeave() {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveRequestInput) => leaveService.apply(actor, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEY });
      toast.success('Leave request submitted for approval');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useAbsences() {
  return useQuery({ queryKey: [...LEAVE_KEY, 'absences'], queryFn: () => leaveService.listAbsences() });
}

// The approved absence covering `date` for this person, if any
export function findAbsence(absences: LeaveAbsence[], userId: string, date: string | undefined): LeaveAbsence | undefined {
  if (!date) return undefined;
  return absences.find((absence) => absence.userId === userId && absence.startDate <= date && date <= absence.endDate);
}

export function useAbsenceOn(userId: string, date: string | undefined): LeaveAbsence | undefined {
  const { data = [] } = useAbsences();
  return findAbsence(data, userId, date);
}
