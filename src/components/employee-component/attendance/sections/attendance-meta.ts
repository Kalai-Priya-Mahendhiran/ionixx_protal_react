import { AlertCircle, CalendarOff, CheckCircle, Clock, Clock3, Home, PartyPopper, XCircle, type LucideIcon } from 'lucide-react';
import type { AttendanceStatus } from '@/services/apis/attendance/attendance-service';

/*
 * How each attendance status looks, used by the Attendance calendar and history and by
 * the manager's Attendance Monitoring. A new status is one entry here.
 */
export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, { label: string; badge: string; cell: string; icon: LucideIcon; iconClass: string }> = {
  present: { label: 'Present', badge: 'bg-green-100 text-green-800', cell: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconClass: 'text-green-600' },
  late: { label: 'Late', badge: 'bg-amber-100 text-amber-800', cell: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle, iconClass: 'text-amber-600' },
  'half-day': { label: 'Half Day', badge: 'bg-orange-100 text-orange-800', cell: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock3, iconClass: 'text-orange-600' },
  absent: { label: 'Absent', badge: 'bg-red-100 text-red-800', cell: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, iconClass: 'text-red-600' },
  leave: { label: 'On Leave', badge: 'bg-blue-100 text-blue-800', cell: 'bg-blue-100 text-blue-800 border-blue-200', icon: CalendarOff, iconClass: 'text-blue-600' },
  wfh: { label: 'WFH', badge: 'bg-teal-100 text-teal-800', cell: 'bg-teal-100 text-teal-800 border-teal-200', icon: Home, iconClass: 'text-teal-600' },
  holiday: { label: 'Weekend / Holiday', badge: 'bg-gray-100 text-gray-600', cell: 'bg-gray-50 text-gray-400 border-gray-100', icon: PartyPopper, iconClass: 'text-gray-400' },
  'not-in-yet': { label: 'Not in yet', badge: 'bg-gray-100 text-gray-700', cell: 'bg-indigo-50/50 text-gray-600 border-indigo-100', icon: Clock, iconClass: 'text-gray-500' },
};

// Hours as "7h 45m"
export const formatHours = (hours: number) => {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
};
