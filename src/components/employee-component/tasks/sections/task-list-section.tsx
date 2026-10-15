import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Ban, ListChecks } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { can, canTransition } from '@/lib/permissions/task-permissions';
import { TASK_PRIORITIES, TASK_WORKFLOW_STATUSES } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDateTime } from '@/lib/utils';
import { useChangeTaskStatus, useSprints } from '@/services/apis/tasks/use-tasks';
import type { Sprint, Task, TaskStatus } from '@/types';
import { TaskActionsMenu } from './task-actions-menu';
import { DueDateChip, PriorityIndicator, TaskTypeIcon, UserChip } from './task-badges';
import { TASK_STATUS_CONFIG } from './task-config';
import { taskPath } from './task-link';
import type { SubtaskProgress } from './task-utils';

type SortKey = 'key' | 'title' | 'assignee' | 'reporter' | 'priority' | 'status' | 'sprint' | 'dueDate' | 'createdAt' | 'updatedAt';
type SortState = { key: SortKey; direction: 'asc' | 'desc' } | null;

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'key', label: 'Work', className: 'min-w-[340px]' },
  { key: 'assignee', label: 'Assignee', className: 'min-w-[170px]' },
  { key: 'reporter', label: 'Reporter', className: 'min-w-[170px]' },
  { key: 'priority', label: 'Priority', className: 'min-w-[110px]' },
  { key: 'status', label: 'Status', className: 'min-w-[150px]' },
  { key: 'sprint', label: 'Sprint', className: 'min-w-[120px]' },
  { key: 'dueDate', label: 'Due date', className: 'min-w-[140px]' },
  { key: 'createdAt', label: 'Created', className: 'min-w-[170px]' },
  { key: 'updatedAt', label: 'Updated', className: 'min-w-[170px]' },
];

const keyNumber = (task: Task) => Number(task.key.split('-').pop()) || 0;

function sortValue(task: Task, key: SortKey, sprints: Sprint[]): string | number {
  switch (key) {
    case 'key':
      return `${task.key.split('-')[0]}-${String(keyNumber(task)).padStart(6, '0')}`;
    case 'title':
      return task.title.toLowerCase();
    case 'assignee':
      return getUserById(task.assigneeId)?.name ?? '';
    case 'reporter':
      return getUserById(task.reporterId)?.name ?? '';
    case 'priority':
      return TASK_PRIORITIES.indexOf(task.priority);
    case 'status':
      return TASK_WORKFLOW_STATUSES.indexOf(task.status);
    case 'sprint':
      return sprints.find((sprint) => sprint.id === task.sprintId)?.name ?? '';
    default:
      return task[key] ?? '';
  }
}

function StatusCell({ task }: { task: Task }) {
  const { user } = useAuth();
  const changeStatus = useChangeTaskStatus();
  const config = TASK_STATUS_CONFIG[task.status];

  if (!can(user, 'task.changeStatus', task)) {
    return <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-semibold uppercase', config.className)}>{config.label}</span>;
  }
  return (
    <Select value={task.status} onValueChange={(status) => changeStatus.mutate({ task, status: status as TaskStatus })}>
      <SelectTrigger
        aria-label={`Status of ${task.key}`}
        className={cn('h-7 w-auto gap-1 border-0 px-2 text-xs font-semibold uppercase shadow-none [&>svg]:h-3.5 [&>svg]:w-3.5', config.className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_WORKFLOW_STATUSES.map((status) => (
          <SelectItem key={status} value={status} disabled={status !== task.status && !canTransition(user, task, status)}>
            {TASK_STATUS_CONFIG[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TaskListSectionProps {
  tasks: Task[];
  subtaskProgress: Map<string, SubtaskProgress>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskListSection({ tasks, subtaskProgress, onEdit, onDelete }: TaskListSectionProps) {
  const location = useLocation();
  const { data: sprints = [] } = useSprints();
  const [sort, setSort] = useState<SortState>(null);

  const rows = useMemo(() => {
    if (!sort) return tasks;
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...tasks].sort((a, b) => {
      const left = sortValue(a, sort.key, sprints);
      const right = sortValue(b, sort.key, sprints);
      return (left < right ? -1 : left > right ? 1 : 0) * factor;
    });
  }, [tasks, sort, sprints]);

  // Asc → desc → original order
  const toggleSort = (key: SortKey) =>
    setSort((current) => (current?.key !== key ? { key, direction: 'asc' } : current.direction === 'asc' ? { key, direction: 'desc' } : null));

  // The task page links back to the list with the same view, tab, layout and filters
  const linkState = { from: location.search };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* relative: keeps the visually hidden header label inside the scroll area */}
      <div className="ionixx-scrollbar relative overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
            <tr>
              {COLUMNS.map((column) => {
                const active = sort?.key === column.key;
                const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('px-4 py-2.5', column.className)}
                    aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button type="button" onClick={() => toggleSort(column.key)} className="group inline-flex items-center gap-1 hover:text-gray-900">
                      {column.label}
                      <Icon className={cn('h-3.5 w-3.5', active ? 'text-[#464EB8]' : 'text-gray-300 group-hover:text-gray-500')} />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="w-12 px-2 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((task) => {
              const isDone = task.status === 'done';
              const progress = subtaskProgress.get(task.id);
              const sprint = sprints.find((item) => item.id === task.sprintId);
              return (
                <tr key={task.id} className="group hover:bg-indigo-50/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <TaskTypeIcon type={task.type} />
                      <Link
                        to={taskPath(task.key)}
                        state={linkState}
                        className={cn('shrink-0 font-medium text-[#464EB8] hover:underline', isDone && 'line-through')}
                      >
                        {task.key}
                      </Link>
                      <Link to={taskPath(task.key)} state={linkState} className="min-w-0 truncate text-gray-900 hover:text-[#464EB8] hover:underline" title={task.title}>
                        {task.title}
                      </Link>
                      {task.isBlocked && !isDone && (
                        <span title={task.blockedReason ?? 'Blocked'} className="shrink-0 text-red-600">
                          <Ban className="h-4 w-4" />
                        </span>
                      )}
                      {progress && progress.total > 0 && (
                        <span
                          title="Sub-tasks done"
                          className={cn(
                            'inline-flex shrink-0 items-center gap-0.5 rounded px-1 text-xs font-medium',
                            progress.done === progress.total ? 'bg-green-100 text-green-700' : 'text-gray-500',
                          )}
                        >
                          <ListChecks className="h-3.5 w-3.5" />
                          {progress.done}/{progress.total}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <UserChip userId={task.assigneeId} />
                  </td>
                  <td className="px-4 py-2.5">
                    <UserChip userId={task.reporterId} />
                  </td>
                  <td className="px-4 py-2.5">
                    <PriorityIndicator priority={task.priority} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusCell task={task} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{sprint ? sprint.name : <span className="text-gray-400">Backlog</span>}</td>
                  <td className="px-4 py-2.5">
                    <DueDateChip task={task} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{formatDateTime(task.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-gray-600">{formatDateTime(task.updatedAt)}</td>
                  <td className="px-2 py-2.5 text-right">
                    <TaskActionsMenu task={task} onEdit={onEdit} onDelete={onDelete} triggerClassName="h-7 w-7 p-0" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
        {rows.length} {rows.length === 1 ? 'task' : 'tasks'}
      </p>
    </div>
  );
}
