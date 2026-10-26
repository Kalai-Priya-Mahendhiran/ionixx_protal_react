import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { canTransition, type PermissionUser } from '@/lib/permissions/task-permissions';
import { getWorkflowStatuses } from '@/lib/workflow';
import { cn } from '@/lib/utils';
import { useChangeTaskStatus } from '@/services/apis/tasks/use-tasks';
import type { Task, TaskStatus } from '@/types';
import { getStatusMeta } from '@/components/employee-component/tasks/sections/task-config';

export function StatusSection({ task, user, canChangeStatus }: { task: Task; user: PermissionUser; canChangeStatus: boolean }) {
  const changeStatus = useChangeTaskStatus();

  return (
    <div className="flex items-center gap-2">
      <Select value={task.status} disabled={!canChangeStatus} onValueChange={(status) => changeStatus.mutate({ task, status: status as TaskStatus })}>
        <SelectTrigger aria-label="Status" className={cn('h-10 w-44 font-semibold', getStatusMeta(task.status).className)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {getWorkflowStatuses().map(({ id: status }) => (
            <SelectItem key={status} value={status} disabled={status !== task.status && !canTransition(user, task, status)}>
              {getStatusMeta(status).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {canChangeStatus && task.status === 'in-review' && !canTransition(user, task, 'done') && (
        <p className="text-xs text-gray-500">Waiting for a manager to approve.</p>
      )}
    </div>
  );
}
