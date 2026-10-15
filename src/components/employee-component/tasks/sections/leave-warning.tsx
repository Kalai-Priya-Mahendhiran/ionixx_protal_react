import { CalendarOff } from 'lucide-react';
import { getUserById } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { useAbsenceOn } from '@/services/apis/leave/use-leave';
import type { LeaveAbsence } from '@/types';
import { formatShortDate } from './task-utils';

const formatRange = ({ startDate, endDate }: LeaveAbsence) =>
  startDate === endDate ? formatShortDate(startDate) : `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;

interface LeaveWarningProps {
  userId: string;
  // The date to check, usually the task's due date
  date: string | undefined;
  // Done work doesn't need a warning
  hidden?: boolean;
  className?: string;
}

// Compact chip for cards and table rows. Shows only the dates, never the leave type or reason.
export function OnLeaveChip({ userId, date, hidden, className }: LeaveWarningProps) {
  const absence = useAbsenceOn(userId, date);
  if (!absence || hidden) return null;
  return (
    <span
      title={`${getUserById(userId)?.name ?? 'The assignee'} is on leave ${formatRange(absence)}`}
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800', className)}
    >
      <CalendarOff className="h-3 w-3" aria-hidden />
      Assignee on leave
    </span>
  );
}

// Fuller message for the task page and the create/edit form
export function OnLeaveBanner({ userId, date, hidden, className }: LeaveWarningProps) {
  const absence = useAbsenceOn(userId, date);
  if (!absence || hidden) return null;
  const name = getUserById(userId)?.name ?? 'The assignee';
  return (
    <p role="status" className={cn('flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900', className)}>
      <CalendarOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <b>⚠ Assignee on leave.</b> {name} is on approved leave {formatRange(absence)}, which covers the due date. Consider moving the date or
        reassigning.
      </span>
    </p>
  );
}
