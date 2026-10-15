import { Clock, IterationCw, Pencil, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { can } from '@/lib/permissions/task-permissions';
import { useEpics, useSprints } from '@/services/apis/tasks/use-tasks';
import type { EpicSummary, Sprint, Task } from '@/types';
import { BlockedBadge, DueDateChip, PriorityIndicator, TaskStatusBadge, TaskTypeIcon, UserChip } from './task-badges';
import { TaskActionsMenu } from './task-actions-menu';
import { getLabelColor } from './task-config';

interface TaskCardProps {
  task: Task;
  sprint?: Sprint;
  epic?: EpicSummary;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskCard({ task, sprint, epic, onEdit, onDelete }: TaskCardProps) {
  const { user } = useAuth();
  const canEdit = can(user, 'task.edit', task);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TaskTypeIcon type={task.type} />
              <span className="text-sm font-semibold text-[#464EB8]">{task.key}</span>
              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
              <TaskStatusBadge status={task.status} />
              {task.isBlocked && task.status !== 'done' && <BlockedBadge reason={task.blockedReason} />}
            </div>

            {task.description && <p className="line-clamp-2 text-gray-600">{task.description}</p>}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <PriorityIndicator priority={task.priority} />
              <DueDateChip task={task} />
              <UserChip userId={task.assigneeId} label="Assignee" />
              <UserChip userId={task.reporterId} label="Reporter" />
              {task.estimateHours !== undefined && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {task.loggedHours}h / {task.estimateHours}h
                </span>
              )}
            </div>

            {(task.labels.length > 0 || sprint || epic) && (
              <div className="flex flex-wrap gap-1.5">
                {epic && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                    <Zap className="h-3 w-3" />
                    {epic.title}
                  </span>
                )}
                {sprint && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                    <IterationCw className="h-3 w-3" />
                    {sprint.name}
                  </span>
                )}
                {task.labels.map((label) => (
                  <span key={label} className={`rounded-md px-2 py-0.5 text-xs font-medium ${getLabelColor(label)}`}>
                    {label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            <TaskActionsMenu task={task} onDelete={onDelete} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TaskListSectionProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskListSection({ tasks, onEdit, onDelete }: TaskListSectionProps) {
  const { data: sprints = [] } = useSprints();
  const { data: epics = [] } = useEpics();

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          sprint={sprints.find((sprint) => sprint.id === task.sprintId)}
          epic={epics.find((epic) => epic.id === task.epicId)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
