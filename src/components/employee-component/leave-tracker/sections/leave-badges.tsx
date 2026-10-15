import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { DEFAULT_BADGE_COLOR, LEAVE_STATUS_COLORS, LEAVE_STATUS_LABELS, LEAVE_TYPES } from '@/lib/constants';
import type { LeaveRequest } from '@/types';

export const getStatusIcon = (status: LeaveRequest['status']) => {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

export const getStatusBadge = (status: LeaveRequest['status']) => (
  <Badge variant="outline" className={`border-transparent ${LEAVE_STATUS_COLORS[status] ?? DEFAULT_BADGE_COLOR}`}>
    {LEAVE_STATUS_LABELS[status] ?? status}
  </Badge>
);

export const getLeaveTypeBadge = (type: string) => {
  const leaveType = LEAVE_TYPES.find(lt => lt.id === type);
  return (
    <Badge variant="outline" className={`border-transparent ${leaveType?.color ?? DEFAULT_BADGE_COLOR}`}>
      {leaveType?.label ?? type}
    </Badge>
  );
};
