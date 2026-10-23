import { Link } from 'react-router-dom';
import { Award, Cake, Calendar, CalendarOff, CheckSquare, PartyPopper, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_LEAVE_COUNTRY } from '@/lib/constants';
import { buildUpcoming, relativeDay, type UpcomingKind } from '@/lib/dashboard-feeds';
import { HOLIDAYS_BY_COUNTRY } from '@/lib/sample-data/leave-tracker-sample-data';
import { getActiveUsers } from '@/lib/user-directory';
import { cn, todayAsDateInput } from '@/lib/utils';
import { useLeaveRequests } from '@/services/apis/leave/use-leave';
import { useTasks } from '@/services/apis/tasks/use-tasks';
import { useOrgPeople } from '@/services/apis/users/use-org-chart';
import { DASHBOARD_LIST_CLASS } from './dashboard-list';

const KIND: Record<UpcomingKind, { icon: LucideIcon; tile: string; label: string }> = {
  task: { icon: CheckSquare, tile: 'bg-blue-100 text-blue-600', label: 'Task' },
  leave: { icon: CalendarOff, tile: 'bg-amber-100 text-amber-600', label: 'Leave' },
  holiday: { icon: PartyPopper, tile: 'bg-pink-100 text-pink-600', label: 'Holiday' },
  anniversary: { icon: Award, tile: 'bg-purple-100 text-purple-600', label: 'Anniversary' },
  birthday: { icon: Cake, tile: 'bg-rose-100 text-rose-600', label: 'Birthday' },
};

// The next two weeks: your due tasks and leave, holidays and colleagues' work anniversaries
export function UpcomingEventsSection() {
  const { user } = useAuth();
  const today = todayAsDateInput();
  const { data: tasks = [] } = useTasks();
  const { data: leave = [] } = useLeaveRequests();
  // Subscribed so new joiners and leavers update the anniversaries
  useOrgPeople();
  const items = buildUpcoming({ userId: user?.id ?? '', today, tasks, leave, holidays: HOLIDAYS_BY_COUNTRY[DEFAULT_LEAVE_COUNTRY], people: getActiveUsers() });

  return (
    <Card className="border-0 shadow-xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#464EB8]" />
          <span>Coming Up</span>
        </CardTitle>
        <CardDescription>Your next two weeks: tasks due, leave, holidays and team milestones</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Nothing scheduled for the next two weeks.</p>
        ) : (
          <ul className={DASHBOARD_LIST_CLASS}>
            {items.map((item) => {
              const { icon: Icon, tile, label } = KIND[item.kind];
              const body = (
                <>
                  <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', tile)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-gray-900">{item.title}</span>
                    <span className="block truncate text-sm text-gray-600">{item.detail}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-medium text-gray-900">{relativeDay(item.date, today)}</span>
                    <span className="block text-xs text-gray-500">{label}</span>
                  </span>
                </>
              );
              const className = 'flex items-center gap-4 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50';
              return <li key={item.id}>{item.href ? <Link to={item.href} className={className}>{body}</Link> : <div className={className}>{body}</div>}</li>;
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
