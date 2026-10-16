import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { LEAVE_TYPES, getIcon } from '@/lib/constants';
import { LEAVE_BALANCE } from '@/lib/sample-data/leave-tracker-sample-data';
import type { LeaveRequest } from '@/types';
import { RestrictedHolidayInfo } from './restricted-holiday-info';

interface LeaveBalanceSectionProps {
  requests: LeaveRequest[];
}

export function LeaveBalanceSection({ requests }: LeaveBalanceSectionProps) {
  // Only approved leaves are deducted from the balance
  const usedDays = (type: LeaveRequest['leaveType']) => requests
    .filter((request) => request.leaveType === type && request.status === 'approved')
    .reduce((total, request) => total + (request.days ?? 0), 0);

  return (
    <StatGrid>
      {LEAVE_TYPES.map((leaveType) => {
        const type = leaveType.id as LeaveRequest['leaveType'];
        const allotted = LEAVE_BALANCE[type];
        // Unlimited types (Loss Of Pay) show days taken; the rest show days left out of the allotment
        const hintText = allotted === null ? 'days taken' : `of ${allotted} ${allotted === 1 ? 'day' : 'days'}`;
        return (
          <StatCard
            key={type}
            icon={getIcon(leaveType.icon)}
            label={leaveType.label}
            value={allotted === null ? usedDays(type) : allotted - usedDays(type)}
            iconClassName={leaveType.iconClass}
            hint={
              type === 'restricted-holiday' ? (
                <span className="inline-flex items-center gap-1">
                  {hintText}
                  <RestrictedHolidayInfo />
                </span>
              ) : (
                hintText
              )
            }
          />
        );
      })}
    </StatGrid>
  );
}
