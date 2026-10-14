import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import type { Attendance } from '@/types';

interface CalendarViewSectionProps {
  records: Attendance[];
}

export function CalendarViewSection({ records }: CalendarViewSectionProps) {
  return (
    <Card className="lg:col-span-2 border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Attendance Calendar</span>
        </CardTitle>
        <CardDescription>View your attendance for the current month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-semibold uppercase tracking-wide text-indigo-600 p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 31 }, (_, i) => {
            const date = i + 1;
            const dateStr = `2024-01-${date.toString().padStart(2, '0')}`;
            const attendance = records.find(record => record.date === dateStr);

            return (
              <div
                key={date}
                className={`
                  aspect-square flex items-center justify-center text-sm font-medium rounded-xl border transition-transform duration-150 hover:scale-105
                  ${attendance
                    ? attendance.status === 'present'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : attendance.status === 'late'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-indigo-50/50 text-gray-600 border-indigo-100'
                  }
                `}
              >
                {date}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center space-x-6 mt-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Absent</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
