import { LEAVE_CALENDAR_DAY_STYLES, LEAVE_DAY_PARTS, LEAVE_STATUS_FILTER_OPTIONS } from '@/lib/constants';
import { toDateInput } from '@/lib/utils';
import type { Holiday, LeaveDayPart, LeaveRequest } from '@/types';

export type CalendarDayStatus = keyof typeof LEAVE_CALENDAR_DAY_STYLES;

export const ALL_LEAVE_STATUSES: LeaveRequest['status'][] = LEAVE_STATUS_FILTER_OPTIONS.map((option) => option.value);

// Parses a YYYY-MM-DD value in local time (new Date('YYYY-MM-DD') would parse it as UTC)
export const parseDateInput = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatLeaveDate = (value: string) =>
  parseDateInput(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

export const getDayPartLabel = (part: LeaveDayPart = 'full-day') =>
  LEAVE_DAY_PARTS.find((option) => option.value === part)?.label ?? 'Full Day';

export const isWeekend = (value: string) => [0, 6].includes(parseDateInput(value).getDay());

export const getDatesInRange = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  for (let date = parseDateInput(startDate); toDateInput(date) <= endDate; date.setDate(date.getDate() + 1)) {
    dates.push(toDateInput(date));
  }
  return dates;
};

// Public holidays and weekends are not counted; restricted holidays are optional, so they count as working days
export const countLeaveDays = (
  startDate: string,
  startDayPart: LeaveDayPart,
  endDate: string,
  endDayPart: LeaveDayPart,
  holidays: Holiday[],
) => {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const publicHolidays = new Set(holidays.filter((holiday) => holiday.type === 'public').map((holiday) => holiday.date));
  const isLeaveDay = (date: string) => !isWeekend(date) && !publicHolidays.has(date);

  const leaveDays = getDatesInRange(startDate, endDate).filter(isLeaveDay).length;
  if (startDate === endDate) return startDayPart === 'full-day' ? leaveDays : leaveDays / 2;

  let days = leaveDays;
  if (startDayPart === 'second-half' && isLeaveDay(startDate)) days -= 0.5;
  if (endDayPart === 'first-half' && isLeaveDay(endDate)) days -= 0.5;
  return days;
};

export const isActiveLeaveOn = (request: LeaveRequest, date: string) =>
  request.status !== 'rejected' && request.startDate <= date && request.endDate >= date;

export const getCalendarDayStatus = (
  date: string,
  approvedLeaves: LeaveRequest[],
  holiday?: Holiday,
): CalendarDayStatus => {
  if (holiday?.type === 'public') return 'public-holiday';
  if (isWeekend(date)) return 'weekend';
  if (approvedLeaves.some((request) => request.startDate <= date && request.endDate >= date)) return 'on-leave';
  if (holiday?.type === 'restricted') return 'restricted-holiday';
  return 'working-day';
};

// Half-day marker for a calendar cell, if the leave covers only part of that date
export const getHalfDayPart = (date: string, approvedLeaves: LeaveRequest[]) => {
  const leave = approvedLeaves.find((request) => request.startDate <= date && request.endDate >= date);
  if (!leave) return undefined;
  if (date === leave.startDate && leave.startDayPart && leave.startDayPart !== 'full-day') return leave.startDayPart;
  if (date === leave.endDate && leave.endDayPart && leave.endDayPart !== 'full-day') return leave.endDayPart;
  return undefined;
};
