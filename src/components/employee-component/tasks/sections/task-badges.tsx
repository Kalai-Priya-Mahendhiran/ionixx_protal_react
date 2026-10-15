import { AlertTriangle, Calendar, Ban } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus, TaskType } from '@/types';
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, TASK_TYPE_CONFIG } from './task-config';
import { daysUntil, formatShortDate, getDueState, type DueState } from './task-utils';

// Plain coloured type square, e.g. inside select options
export function TaskTypeGlyph({ type }: { type: TaskType }) {
  const { label, icon: Icon, className } = TASK_TYPE_CONFIG[type];
  return (
    <span className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded', className)} aria-label={label}>
      <Icon className="h-3.5 w-3.5 text-white" />
    </span>
  );
}

export function TaskTypeIcon({ type }: { type: TaskType }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <TaskTypeGlyph type={type} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{TASK_TYPE_CONFIG[type].label}</TooltipContent>
    </Tooltip>
  );
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const { label, icon: Icon, className } = TASK_PRIORITY_CONFIG[priority];
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-medium', className)}>
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, className } = TASK_STATUS_CONFIG[status];
  return <Badge className={cn('border-transparent hover:bg-opacity-100', className)}>{label}</Badge>;
}

export function BlockedBadge({ reason }: { reason?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="gap-1 border-transparent bg-red-100 text-red-700 hover:bg-red-100">
          <Ban className="h-3 w-3" />
          Blocked
        </Badge>
      </TooltipTrigger>
      {reason && <TooltipContent>{reason}</TooltipContent>}
    </Tooltip>
  );
}

const DUE_CHIP_CLASS: Record<DueState, string> = {
  overdue: 'bg-red-50 text-red-700 border-red-200',
  'due-soon': 'bg-orange-50 text-orange-700 border-orange-200',
  upcoming: 'bg-gray-50 text-gray-600 border-gray-200',
  done: 'bg-gray-50 text-gray-500 border-gray-200',
};

function getDueLabel(dueDate: string, state: DueState): string {
  const formatted = formatShortDate(dueDate);
  if (state === 'overdue') return `Overdue · ${formatted}`;
  if (state === 'due-soon') {
    const days = daysUntil(dueDate);
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
  }
  return `Due ${formatted}`;
}

export function DueDateChip({ task }: { task: Pick<Task, 'dueDate' | 'status'> }) {
  const state = getDueState(task);
  const Icon = state === 'overdue' ? AlertTriangle : Calendar;
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', DUE_CHIP_CLASS[state])}>
      <Icon className="h-3 w-3" aria-hidden />
      {getDueLabel(task.dueDate, state)}
    </span>
  );
}

export function UserChip({ userId, label }: { userId: string; label?: string }) {
  const user = getUserById(userId);
  const name = user?.name ?? 'Unknown user';
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
      {label && <span className="text-gray-500">{label}:</span>}
      <Avatar className="h-6 w-6">
        {user?.avatar && <AvatarImage src={user.avatar} alt={name} />}
        <AvatarFallback className="bg-indigo-100 text-[10px] font-semibold text-indigo-700">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-gray-800">{name}</span>
    </span>
  );
}
