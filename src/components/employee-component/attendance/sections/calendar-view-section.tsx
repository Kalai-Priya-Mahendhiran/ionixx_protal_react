import { Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AttendanceRecord, AttendanceStatus } from '@/services/apis/attendance/attendance-service';
import { ATTENDANCE_STATUS_META, formatHours } from './attendance-meta';

interface CalendarViewSectionProps {
  // 'YYYY-MM'
  month: string;
  records: AttendanceRecord[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Legend: only statuses that appear this month
const LEGEND_ORDER: AttendanceStatus[] = ['present', 'late', 'half-day', 'wfh', 'leave', 'absent', 'holiday'];

export function CalendarViewSection({ month, records }: CalendarViewSectionProps) {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const leadingBlanks = new Date(year, monthNumber - 1, 1).getDay();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shown = LEGEND_ORDER.filter((status) => records.some((record) => record.status === status));

  return (
    <Card className="border-0 shadow-xl lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="rounded-lg bg-indigo-100 p-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Attendance Calendar</span>
        </CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <div key={`blank-${index}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = `${month}-${String(day).padStart(2, '0')}`;
            const record = byDate.get(date);
            const meta = record ? ATTENDANCE_STATUS_META[record.status] : undefined;
            const title = record ? `${meta!.label}${record.checkIn ? ` · ${record.checkIn}–${record.checkOut ?? 'now'} (${formatHours(record.hoursWorked)})` : ''}` : 'Upcoming';
            return (
              <div
                key={date}
                title={title}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-xl border text-sm font-medium transition-transform duration-150 hover:scale-105',
                  meta ? meta.cell : 'border-gray-100 bg-white text-gray-400',
                )}
              >
                {day}
              </div>
            );
          })}
        </div>

        {shown.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-600">
            {shown.map((status) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded border', ATTENDANCE_STATUS_META[status].cell)} />
                <span>{ATTENDANCE_STATUS_META[status].label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
