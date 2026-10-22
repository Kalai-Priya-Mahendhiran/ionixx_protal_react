import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle, Clock, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildActivity, timeAgo, type ActivityKind } from '@/lib/dashboard-feeds';
import { todayAsDateInput } from '@/lib/utils';
import { useMyAttendanceToday } from '@/services/apis/attendance/use-attendance';
import { useMyActivity } from '@/services/apis/audit/use-my-activity';
import { useLeaveRequests } from '@/services/apis/leave/use-leave';
import { useTimeEntries } from '@/services/apis/time-tracker/use-time-entries';

const KIND: Record<ActivityKind, { icon: LucideIcon; color: string }> = {
  attendance: { icon: CheckCircle, color: 'text-green-600' },
  leave: { icon: CalendarDays, color: 'text-amber-600' },
  task: { icon: Target, color: 'text-blue-600' },
  time: { icon: Clock, color: 'text-purple-600' },
  other: { icon: Zap, color: 'text-gray-600' },
};

// What you did recently: check-ins, leave, time logged and changes you made, newest first
export function RecentActivitiesSection() {
  const { data: audit = [] } = useMyActivity();
  const { data: leave = [] } = useLeaveRequests();
  const { data: timeEntries = [] } = useTimeEntries();
  const { data: today } = useMyAttendanceToday();
  const items = buildActivity({ audit, leave, timeEntries, today: todayAsDateInput(), checkIn: today?.checkIn, checkOut: today?.checkOut });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <span>Recent Activities</span>
        </CardTitle>
        <CardDescription>Your latest updates and actions</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">Your activity will show up here.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => {
              const { icon: Icon, color } = KIND[item.kind];
              const body = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Icon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">{item.message}</span>
                    <span className="block text-xs text-gray-500">{timeAgo(item.at)}</span>
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
