import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { todayAsDateInput } from '@/lib/utils';
import { attendanceService } from './attendance-service';
import { ORG_PEOPLE_KEY } from '../users/use-org-chart';

export const ATTENDANCE_KEY = ['attendance'] as const;

// Attendance hooks work signed out too (the provider wraps the login page); they just stay idle
const useActor = () => useAuth().user;

export function useMyAttendanceToday() {
  const actor = useActor();
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, 'today', actor?.id, todayAsDateInput()],
    queryFn: () => attendanceService.today(actor!),
    enabled: !!actor,
    // Hours worked keep counting while checked in
    refetchInterval: 60_000,
  });
}

// month: 'YYYY-MM'
export function useMyAttendanceMonth(month: string) {
  const actor = useActor();
  return useQuery({ queryKey: [...ATTENDANCE_KEY, 'month', actor?.id, month], queryFn: () => attendanceService.month(actor!, month), enabled: !!actor });
}

export function useTeamAttendance(date = todayAsDateInput()) {
  const actor = useActor();
  return useQuery({ queryKey: [...ATTENDANCE_KEY, 'team', actor?.id, date], queryFn: () => attendanceService.team(actor!, date), enabled: !!actor, refetchInterval: 60_000 });
}

function useAttendanceMutation<TVariables>(run: (variables: TVariables) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
      // Team Overview, the org chart and the directory show today's status from attendance
      queryClient.invalidateQueries({ queryKey: ORG_PEOPLE_KEY });
      toast.success(success);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useCheckIn() {
  const actor = useActor();
  return useAttendanceMutation(() => attendanceService.checkIn(actor!), 'Checked in · have a good day');
}

export function useCheckOut() {
  const actor = useActor();
  return useAttendanceMutation(() => attendanceService.checkOut(actor!), 'Checked out · see you tomorrow');
}

export function useResolveAttendance() {
  const actor = useActor();
  return useAttendanceMutation(({ userId, date, note }: { userId: string; date: string; note: string }) => attendanceService.resolve(actor!, userId, date, note), 'Exception resolved');
}
