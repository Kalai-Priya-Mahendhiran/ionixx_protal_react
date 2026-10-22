import { useQuery } from '@tanstack/react-query';
import { getOrgPeople, withLeaveToday } from '@/lib/org-chart';
import { todayAsDateInput } from '@/lib/utils';
import { leaveService } from '../leave/leave-service';
import { USERS_KEY } from './use-user-access';

/*
 * The org chart's people, read fresh from the user directory, with today's approved leave applied.
 * Every User Management change (invite, deactivate, role change…) and every leave decision invalidates
 * all queries, so new team members, moves, leavers and people on leave appear without a page reload.
 * With the backend this becomes GET /api/org-chart.
 */
export function useOrgPeople() {
  return useQuery({
    queryKey: [...USERS_KEY, 'org-chart'],
    queryFn: async () => withLeaveToday(getOrgPeople(), await leaveService.listAbsences(), todayAsDateInput()),
    initialData: getOrgPeople,
  });
}
