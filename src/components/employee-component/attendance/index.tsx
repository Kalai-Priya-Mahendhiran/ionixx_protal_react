import {
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck,
  type LucideIcon
} from 'lucide-react';
import { StatCard, StatGrid, type StatTone } from '@/components/ui/stat-card';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { sampleAttendance } from '@/lib/sample-data/attendance-sample-data';
import { CheckInOutSection, CalendarViewSection, RecentAttendanceSection } from './sections';

export default function Attendance() {
  const currentMonthAttendance = sampleAttendance.filter(record =>
    new Date(record.date).getMonth() === new Date().getMonth()
  );

  const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const presentDays = currentMonthAttendance.filter(record => record.status === 'present').length;
  const absentDays = currentMonthAttendance.filter(record => record.status === 'absent').length;
  const lateDays = currentMonthAttendance.filter(record => record.status === 'late').length;

  const stats: { label: string; value: number | string; icon: LucideIcon; tone: StatTone }[] = [
    { label: 'Present Days', value: presentDays, icon: CheckCircle, tone: 'green' },
    { label: 'Absent Days', value: absentDays, icon: XCircle, tone: 'red' },
    { label: 'Late Days', value: lateDays, icon: AlertCircle, tone: 'amber' },
    { label: 'Attendance %', value: `${Math.round((presentDays / totalDays) * 100)}%`, icon: TrendingUp, tone: 'purple' },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader icon={CalendarCheck} title="Attendance" description="Track your daily attendance and working hours" />

        {/* Quick Stats */}
        <StatGrid>
          {stats.map(({ label, value, icon, tone }) => (
            <StatCard key={label} icon={icon} label={label} value={value} tone={tone} />
          ))}
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Attendance */}
          <CheckInOutSection />

          {/* Calendar View */}
          <CalendarViewSection records={sampleAttendance} />
        </div>

        {/* Recent Attendance */}
        <RecentAttendanceSection records={sampleAttendance} />
      </div>
    </MainLayout>
  );
}
