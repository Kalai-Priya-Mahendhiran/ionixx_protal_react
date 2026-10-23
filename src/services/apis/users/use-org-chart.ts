import { useQuery } from '@tanstack/react-query';
import { getOrgPeople, withLeaveToday } from '@/lib/org-chart';
import { todayAsDateInput } from '@/lib/utils';
import { attendanceService } from '../attendance/attendance-service';
import { leaveService } from '../leave/leave-service';
import { USERS_KEY } from './use-user-access';

/*
 * The org chart's people, read fresh from the user directory, with today's status from attendance
 * (in office / remote / on leave / not checked in). Every User Management change, leave decision and
 * check-in invalidates this, so Team Overview, the org chart and the directory always agree with
 * Attendance Monitoring. With the backend this becomes GET /api/org-chart.
 */
export const ORG_PEOPLE_KEY = [...USERS_KEY, 'org-chart'] as const;

export function useOrgPeople() {
  return useQuery({
    queryKey: ORG_PEOPLE_KEY,
    queryFn: async () => {
      const today = todayAsDateInput();
      const [absences, presence] = await Promise.all([leaveService.listAbsences(), attendanceService.presence(today)]);
      return withLeaveToday(getOrgPeople(), absences, today).map((person) =>
        person.status === 'invited' || !presence[person.id] ? person : { ...person, status: presence[person.id] },
      );
    },
    initialData: getOrgPeople,
    // Check-ins happen all morning
    refetchInterval: 60_000,
  });
}
