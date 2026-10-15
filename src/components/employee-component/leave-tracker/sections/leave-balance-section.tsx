import { Card, CardContent } from '@/components/ui/card';
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {LEAVE_TYPES.map((leaveType) => {
        const type = leaveType.id as LeaveRequest['leaveType'];
        const Icon = getIcon(leaveType.icon);
        const allotted = LEAVE_BALANCE[type];
        return (
          <Card key={type} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-md shrink-0 ${leaveType.iconClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-medium text-gray-500">
                    <span className="truncate">{leaveType.label}</span>
                    {type === 'restricted-holiday' && <RestrictedHolidayInfo />}
                  </p>
                  <p className="text-lg font-bold leading-tight text-gray-800">
                    {allotted === null ? usedDays(type) : allotted - usedDays(type)}
                    {allotted !== null && <span className="text-xs font-medium text-gray-400"> / {allotted}</span>}
                    <span className="ml-1 text-[11px] font-normal text-gray-500">
                      {allotted === null ? 'days taken' : 'days left'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
