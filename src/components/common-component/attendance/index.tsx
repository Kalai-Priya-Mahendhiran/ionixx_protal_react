import { useState } from 'react';
import { AlertCircle, CalendarCheck, CheckCircle, TrendingUp, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getUserById } from '@/lib/user-directory';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { todayAsDateInput } from '@/lib/utils';
import { useMyAttendanceMonth } from '@/services/apis/attendance/use-attendance';
import { HISTORY_DAYS, attendancePercent } from '@/services/apis/attendance/attendance-service';
import { CalendarViewSection, CheckInOutSection, RecentAttendanceSection } from './sections';

export default function Attendance() {
  const { user } = useAuth();
  const currentMonth = todayAsDateInput().slice(0, 7);
  // The calendar can page back as far as there is history (and not before the person joined)
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - HISTORY_DAYS);
  const joinedMonth = getUserById(user?.id)?.joiningDate?.slice(0, 7) ?? '';
  const minMonth = [historyStart.toISOString().slice(0, 7), joinedMonth].sort().pop() ?? currentMonth;
  const [month, setMonth] = useState(currentMonth);
  // The month on the calendar drives the stat cards; check-ins and approved leave show up straight away
  const { data: records = [], isLoading } = useMyAttendanceMonth(month);
  // Recent days always come from this month, whichever month the calendar shows
  const { data: thisMonth = [] } = useMyAttendanceMonth(currentMonth);

  const count = (status: string) => records.filter((record) => record.status === status).length;
  // Same rule as the dashboard: half days count as half, today only once checked in or the day is over
  const { percent, workingDays } = attendancePercent(records);
  const recent = thisMonth.filter((record) => record.status !== 'holiday').slice(-7).reverse();

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader icon={CalendarCheck} title="Attendance" description="Track your daily attendance and working hours" />

        <StatGrid>
          <StatCard icon={CheckCircle} label="Present Days" value={count('present') + count('wfh')} tone="green" hint={count('wfh') ? `${count('wfh')} WFH` : undefined} loading={isLoading} />
          <StatCard icon={XCircle} label="Absent Days" value={count('absent')} tone="red" loading={isLoading} />
          <StatCard icon={AlertCircle} label="Late Days" value={count('late')} tone="amber" hint={count('half-day') ? `${count('half-day')} half` : undefined} loading={isLoading} />
          <StatCard icon={TrendingUp} label="Attendance %" value={`${percent}%`} tone="purple" hint={`over ${workingDays} working day${workingDays === 1 ? '' : 's'}`} loading={isLoading} />
        </StatGrid>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <CheckInOutSection />
          <CalendarViewSection month={month} records={records} isLoading={isLoading} onMonthChange={setMonth} minMonth={minMonth} maxMonth={currentMonth} />
        </div>

        <RecentAttendanceSection records={recent} />
      </div>
    </MainLayout>
  );
}
