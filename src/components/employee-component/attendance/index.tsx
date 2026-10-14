import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarCheck
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
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

  const stats = [
    { label: 'Present Days', value: presentDays, icon: CheckCircle, iconClass: 'bg-green-100 text-green-600' },
    { label: 'Absent Days', value: absentDays, icon: XCircle, iconClass: 'bg-red-100 text-red-600' },
    { label: 'Late Days', value: lateDays, icon: AlertCircle, iconClass: 'bg-yellow-100 text-yellow-600' },
    { label: 'Attendance %', value: `${Math.round((presentDays / totalDays) * 100)}%`, icon: TrendingUp, iconClass: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarCheck className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Attendance</h1>
              <p className="text-sm text-white/90 mt-0.5">Track your daily attendance and working hours</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon, iconClass }) => (
            <Card key={label} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
