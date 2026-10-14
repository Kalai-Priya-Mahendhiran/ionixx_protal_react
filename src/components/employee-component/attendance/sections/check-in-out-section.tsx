import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Coffee } from 'lucide-react';
import { useAttendance } from '@/context/attendance-context';
import { BREAK_TIMINGS, formatDuration, getIcon } from '@/lib/constants';

export function CheckInOutSection() {
  const { isCheckedIn, checkInTime, checkOutTime } = useAttendance();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!isCheckedIn) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isCheckedIn]);

  const elapsed = checkInTime
    ? formatDuration((checkOutTime ?? now).getTime() - checkInTime.getTime())
    : '0h 0m 0s';

  const status = isCheckedIn ? 'Checked In' : checkOutTime ? 'Checked Out' : 'Not Checked In';
  const statusClass = isCheckedIn
    ? 'bg-green-100 text-green-800'
    : checkOutTime
    ? 'bg-indigo-100 text-indigo-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Clock className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Today's Attendance</span>
        </CardTitle>
        <CardDescription>Tracked from your dashboard check-in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 rounded-full ionixx_icon-gradient ionixx-shadow-lg flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-lg font-bold ionixx-text-gradient">{elapsed}</span>
              <span className="text-xs text-gray-500 mt-1">Worked</span>
            </div>
          </div>
          <Badge className={statusClass}>
            {isCheckedIn && <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse" />}
            {status}
          </Badge>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">Break Timings</p>
          {BREAK_TIMINGS.map(({ label, duration, icon, cardClass, iconClass }) => {
            const Icon = getIcon(icon, Coffee);
            return (
              <div
                key={label}
                className={`flex items-center justify-between p-3 rounded-lg border ${cardClass}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${iconClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{duration}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
