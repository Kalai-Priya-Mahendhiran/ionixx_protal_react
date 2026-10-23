import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, todayAsDateInput } from '@/lib/utils';
import type { AttendanceRecord, AttendanceStatus } from '@/services/apis/attendance/attendance-service';
import { ATTENDANCE_STATUS_META, formatHours } from './attendance-meta';

interface CalendarViewSectionProps {
  // 'YYYY-MM'
  month: string;
  records: AttendanceRecord[];
  isLoading?: boolean;
  // Paging between months; the arrows stop at the first and last month there is attendance for
  onMonthChange: (month: string) => void;
  minMonth: string;
  maxMonth: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Legend: only statuses that appear this month
const LEGEND_ORDER: AttendanceStatus[] = ['present', 'late', 'half-day', 'wfh', 'leave', 'absent', 'holiday'];

// 'YYYY-MM' plus or minus whole months
const shiftMonth = (month: string, by: number) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + by, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const navButtonClass =
  'flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40 disabled:cursor-not-allowed disabled:opacity-40';

export function CalendarViewSection({ month, records, isLoading = false, onMonthChange, minMonth, maxMonth }: CalendarViewSectionProps) {
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const leadingBlanks = new Date(year, monthNumber - 1, 1).getDay();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const label = new Date(year, monthNumber - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shown = LEGEND_ORDER.filter((status) => records.some((record) => record.status === status));
  const today = todayAsDateInput();

  return (
    <Card className="border-0 shadow-xl lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2">
          <div className="rounded-lg bg-indigo-100 p-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
          </div>
          <span>Attendance Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2 sm:p-6 sm:pt-2">
        {/* Month header: arrows either side, month centred */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <button type="button" onClick={() => onMonthChange(shiftMonth(month, -1))} disabled={month <= minMonth} aria-label="Previous month" className={navButtonClass}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900" aria-live="polite">
            {label}
          </h2>
          <button type="button" onClick={() => onMonthChange(shiftMonth(month, 1))} disabled={month >= maxMonth} aria-label="Next month" className={navButtonClass}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2 sm:gap-3">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-indigo-600 sm:text-sm">
              {day}
            </div>
          ))}
        </div>

        <div className={cn('grid grid-cols-7 gap-2 sm:gap-3', isLoading && 'animate-pulse')} aria-busy={isLoading}>
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <div key={`blank-${index}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = `${month}-${String(day).padStart(2, '0')}`;
            const record = byDate.get(date);
            const weekday = (leadingBlanks + index) % 7;
            const isWeekend = weekday === 0 || weekday === 6;
            const isToday = date === today;
            // Days still to come have no record: weekends stay grey, working days stay plain
            const meta = record ? ATTENDANCE_STATUS_META[record.status] : isWeekend ? ATTENDANCE_STATUS_META.holiday : undefined;
            const title = record
              ? `${ATTENDANCE_STATUS_META[record.status].label}${record.checkIn ? ` · ${record.checkIn}–${record.checkOut ?? 'now'} (${formatHours(record.hoursWorked)})` : ''}`
              : isWeekend
                ? 'Weekend'
                : 'Upcoming';
            return (
              <div
                key={date}
                title={title}
                aria-label={`${day} ${label}: ${title}`}
                aria-current={isToday ? 'date' : undefined}
                className={cn(
                  'relative flex h-11 flex-col items-center justify-center rounded-xl border text-sm font-medium transition-transform duration-150 hover:scale-105 sm:h-12',
                  meta ? meta.cell : 'border-gray-200 bg-white text-gray-500',
                  isToday && 'ring-2 ring-cyan-400 ring-offset-2',
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
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded border border-cyan-400 ring-1 ring-cyan-400" />
              <span>Today</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
