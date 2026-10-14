import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleAttendance } from '@/lib/sample-data/attendance-sample-data';
import { CheckInOutSection, CalendarViewSection, RecentAttendanceSection } from './sections';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const currentMonthAttendance = sampleAttendance.filter(record => 
    new Date(record.date).getMonth() === new Date().getMonth()
  );

  const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const presentDays = currentMonthAttendance.filter(record => record.status === 'present').length;
  const absentDays = currentMonthAttendance.filter(record => record.status === 'absent').length;
  const lateDays = currentMonthAttendance.filter(record => record.status === 'late').length;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-2">Track your daily attendance and working hours</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Present Days</p>
                  <p className="text-2xl font-bold text-gray-900">{presentDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent Days</p>
                  <p className="text-2xl font-bold text-gray-900">{absentDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Late Days</p>
                  <p className="text-2xl font-bold text-gray-900">{lateDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance %</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((presentDays / totalDays) * 100)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Check In/Out */}
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
