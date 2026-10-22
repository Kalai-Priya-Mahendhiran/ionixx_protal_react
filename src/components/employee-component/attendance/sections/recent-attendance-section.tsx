import { History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AttendanceRecord } from '@/services/apis/attendance/attendance-service';
import { AttendanceBadge, AttendanceIcon } from './attendance-status';
import { formatHours } from './attendance-meta';

interface RecentAttendanceSectionProps {
  // Newest first
  records: AttendanceRecord[];
}

export function RecentAttendanceSection({ records }: RecentAttendanceSectionProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="rounded-lg bg-indigo-100 p-2">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Recent Attendance Records</span>
        </CardTitle>
        <CardDescription>Your last {records.length} working days</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No attendance recorded yet this month.</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div key={record.date} className="flex items-center justify-between rounded-xl border border-indigo-100 p-4 transition-colors duration-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50">
                <div className="flex items-center space-x-4">
                  <AttendanceIcon status={record.status} />
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(`${record.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm text-gray-600">{record.checkIn ? `${record.checkIn} – ${record.checkOut ?? 'still checked in'}` : record.status === 'leave' ? 'Approved leave' : 'No check-in'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <AttendanceBadge status={record.status} />
                  <p className="w-20 text-right text-sm font-semibold text-indigo-600">{record.hoursWorked ? formatHours(record.hoursWorked) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
