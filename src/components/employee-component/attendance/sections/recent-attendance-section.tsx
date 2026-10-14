import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle, Clock3, History } from 'lucide-react';
import { ATTENDANCE_STATUS } from '@/lib/constants';
import type { Attendance } from '@/types';

interface RecentAttendanceSectionProps {
  records: Attendance[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'present':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'absent':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'late':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'half-day':
      return <Clock3 className="h-4 w-4 text-orange-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusConfig = ATTENDANCE_STATUS.find(s => s.id === status);
  return (
    <Badge className={statusConfig?.color || 'bg-gray-100 text-gray-800'}>
      {statusConfig?.label || status}
    </Badge>
  );
};

export function RecentAttendanceSection({ records }: RecentAttendanceSectionProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Recent Attendance Records</span>
        </CardTitle>
        <CardDescription>Your attendance history for the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-indigo-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 transition-colors duration-200">
              <div className="flex items-center space-x-4">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(record.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {record.checkIn} - {record.checkOut || 'Not checked out'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(record.status)}
                <div className="text-right">
                  <p className="text-sm font-semibold text-indigo-600">
                    {record.hoursWorked || 0} hours
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
