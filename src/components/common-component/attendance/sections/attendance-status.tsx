import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/services/apis/attendance/attendance-service';
import { ATTENDANCE_STATUS_META } from './attendance-meta';

export function AttendanceBadge({ status, className }: { status: AttendanceStatus; className?: string }) {
  const meta = ATTENDANCE_STATUS_META[status];
  return <Badge className={cn(meta.badge, className)}>{meta.label}</Badge>;
}

export function AttendanceIcon({ status, className }: { status: AttendanceStatus; className?: string }) {
  const meta = ATTENDANCE_STATUS_META[status];
  const Icon = meta.icon;
  return <Icon className={cn('h-4 w-4', meta.iconClass, className)} aria-hidden="true" />;
}
