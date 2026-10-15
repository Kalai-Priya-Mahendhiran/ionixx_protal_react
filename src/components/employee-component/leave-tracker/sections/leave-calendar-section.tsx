import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldClass } from '@/components/ui/form-fields';
import {
  HOLIDAY_TYPE_COLORS,
  HOLIDAY_TYPE_LABELS,
  LEAVE_CALENDAR_DAY_STYLES,
  LEAVE_COUNTRIES,
  LEAVE_CALENDAR_PANEL_CLASS,
  WEEKDAY_SHORT_LABELS,
} from '@/lib/constants';
import { todayAsDateInput, toDateInput } from '@/lib/utils';
import type { Holiday, LeaveCountry, LeaveRequest } from '@/types';
import { formatLeaveDate, getCalendarDayStatus, getHalfDayPart } from './leave-utils';
import { RestrictedHolidayInfo } from './restricted-holiday-info';

interface LeaveCalendarSectionProps {
  requests: LeaveRequest[];
  holidays: Holiday[];
  country: LeaveCountry;
  onCountryChange: (country: LeaveCountry) => void;
}

export function LeaveCalendarSection({ requests, holidays, country, onCountryChange }: LeaveCalendarSectionProps) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = todayAsDateInput();
  const approvedLeaves = requests.filter((request) => request.status === 'approved');
  const leadingBlanks = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const monthPrefix = toDateInput(month).slice(0, 7);
  const monthHolidays = holidays.filter((holiday) => holiday.date.startsWith(monthPrefix));

  const changeMonth = (offset: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    // On large screens the row height comes from Apply Leave; the calendar fills it and scrolls
    <div className="relative lg:col-span-2">
      <Card className={`border-0 shadow-xl ${LEAVE_CALENDAR_PANEL_CLASS}`}>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <span>Leave Calendar</span>
            </CardTitle>
            <CardDescription>View your leaves and holidays</CardDescription>
          </div>
          <Select value={country} onValueChange={(value) => onCountryChange(value as LeaveCountry)}>
            <SelectTrigger className={`w-44 ${fieldClass}`} aria-label="Country">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_COUNTRIES.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto ionixx-scrollbar">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="icon" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="font-semibold text-gray-800">
              {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <Button variant="outline" size="icon" onClick={() => changeMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
  
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAY_SHORT_LABELS.map(day => (
              <div key={day} className="text-center text-xs font-semibold uppercase tracking-wide text-indigo-600 p-2">
                {day}
              </div>
            ))}
          </div>
  
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: leadingBlanks }, (_, i) => <div key={`blank-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
              const holiday = holidays.find((item) => item.date === date);
              const status = getCalendarDayStatus(date, approvedLeaves, holiday);
              const halfDay = status === 'on-leave' ? getHalfDayPart(date, approvedLeaves) : undefined;
              const style = LEAVE_CALENDAR_DAY_STYLES[status];
  
              return (
                <div
                  key={date}
                  title={holiday ? `${holiday.name} (${HOLIDAY_TYPE_LABELS[holiday.type]})` : style.label}
                  className={`
                    relative h-11 sm:h-12 flex flex-col items-center justify-center text-sm font-medium rounded-xl border transition-transform duration-150 hover:scale-105
                    ${style.cell}
                    ${date === today ? 'ring-2 ring-offset-1 ring-[#3FCCE8]' : ''}
                  `}
                >
                  {day}
                  {halfDay && <span className="text-[10px] leading-none opacity-90">½ day</span>}
                </div>
              );
            })}
          </div>
  
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-sm text-gray-600">
            {Object.entries(LEAVE_CALENDAR_DAY_STYLES).map(([key, { label, swatch }]) => (
              <div key={key} className="flex items-center space-x-2">
                <div className={`w-3 h-3 border rounded ${swatch}`}></div>
                <span>{label}</span>
                {key === 'restricted-holiday' && <RestrictedHolidayInfo />}
              </div>
            ))}
          </div>
  
          <div className="mt-6 border-t pt-4">
            <p className="text-sm font-semibold text-gray-800 mb-3">Holidays this month</p>
            {monthHolidays.length > 0 ? (
              <ul className="space-y-2">
                {monthHolidays.map((holiday) => (
                  <li key={holiday.date} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-700">
                      <span className="font-medium text-gray-900">{formatLeaveDate(holiday.date)}</span> · {holiday.name}
                    </span>
                    <Badge variant="outline" className={`border-transparent ${HOLIDAY_TYPE_COLORS[holiday.type]}`}>
                      {HOLIDAY_TYPE_LABELS[holiday.type]}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No holidays this month</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
