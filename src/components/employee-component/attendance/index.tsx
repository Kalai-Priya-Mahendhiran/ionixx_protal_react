import { AlertCircle, CalendarCheck, CheckCircle, TrendingUp, XCircle } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { todayAsDateInput } from '@/lib/utils';
import { useMyAttendanceMonth } from '@/services/apis/attendance/use-attendance';
import { CalendarViewSection, CheckInOutSection, RecentAttendanceSection } from './sections';

// Days that count as attended for the percentage
const ATTENDED = new Set(['present', 'late', 'half-day', 'wfh']);

export default function Attendance() {
  const month = todayAsDateInput().slice(0, 7);
  // The signed-in person's month from the attendance service; check-ins and approved leave show up straight away
  const { data: records = [], isLoading } = useMyAttendanceMonth(month);

  const working = records.filter((record) => record.status !== 'holiday' && record.status !== 'leave' && record.status !== 'not-in-yet');
  const count = (status: string) => records.filter((record) => record.status === status).length;
  const attended = working.filter((record) => ATTENDED.has(record.status)).length;
  const percent = working.length ? Math.round((attended / working.length) * 100) : 100;
  const recent = records.filter((record) => record.status !== 'holiday').slice(-7).reverse();

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader icon={CalendarCheck} title="Attendance" description="Track your daily attendance and working hours" />

        <StatGrid>
          <StatCard icon={CheckCircle} label="Present Days" value={count('present') + count('wfh')} tone="green" hint={count('wfh') ? `${count('wfh')} WFH` : undefined} loading={isLoading} />
          <StatCard icon={XCircle} label="Absent Days" value={count('absent')} tone="red" loading={isLoading} />
          <StatCard icon={AlertCircle} label="Late Days" value={count('late')} tone="amber" hint={count('half-day') ? `${count('half-day')} half` : undefined} loading={isLoading} />
          <StatCard icon={TrendingUp} label="Attendance %" value={`${percent}%`} tone="purple" hint={`${attended} of ${working.length} days`} loading={isLoading} />
        </StatGrid>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <CheckInOutSection />
          <CalendarViewSection month={month} records={records} />
        </div>

        <RecentAttendanceSection records={recent} />
      </div>
    </MainLayout>
  );
}
