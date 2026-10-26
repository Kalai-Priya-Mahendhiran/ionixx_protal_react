import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Pencil, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';
import { useSetWatching } from '@/services/apis/tasks/use-tasks';
import type { EpicSummary, Project, Task } from '@/types';
import { TaskActionsMenu } from '@/components/employee-component/tasks/sections/task-actions-menu';
import { TaskTypeGlyph } from '@/components/employee-component/tasks/sections/task-badges';
import { copyTaskLink, taskPath } from '@/components/employee-component/tasks/sections/task-link';

interface TaskHeaderSectionProps {
  task: Task;
  user: PermissionUser;
  project?: Project;
  epic?: EpicSummary;
  parent?: Task;
  backTo: string;
  // Router state that keeps the task list's filters on the way back
  keepListState: { from?: string };
  canWatch: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

// Breadcrumb + header actions
export function TaskHeaderSection({ task, user, project, epic, parent, backTo, keepListState, canWatch, canEdit, onEdit, onDelete }: TaskHeaderSectionProps) {
  const setWatching = useSetWatching();
  const isWatching = task.watcherIds.includes(user.id);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-gray-500">
        <Link to={backTo} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Tasks
        </Link>
        {project && (
          <>
            <span>/</span>
            <span>{project.name}</span>
          </>
        )}
        {epic && !parent && (
          <>
            <span>/</span>
            <Link to={taskPath(epic.key)} state={keepListState} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
              <TaskTypeGlyph type="epic" />
              {epic.key}
            </Link>
          </>
        )}
        {parent && (
          <>
            <span>/</span>
            <Link to={taskPath(parent.key)} state={keepListState} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
              <TaskTypeGlyph type={parent.type} />
              {parent.key}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
          <TaskTypeGlyph type={task.type} />
          {task.key}
        </span>
      </nav>

      <div className="flex items-center gap-1.5">
        {canWatch && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWatching.mutate({ task, watching: !isWatching })}
            disabled={setWatching.isPending}
            aria-pressed={isWatching}
            title={isWatching ? 'Stop watching' : 'Watch this task to get notified about changes'}
            className={cn('gap-1.5', isWatching && 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]')}
          >
            {isWatching ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isWatching ? 'Watching' : 'Watch'}
            <span className="rounded-full bg-white px-1.5 text-xs text-gray-600">{task.watcherIds.length}</span>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => void copyTaskLink(task)} className="gap-1.5" title="Copy a link to share with your team">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        {canEdit && (
          <Button variant="outline" size="sm" onClick={onEdit} title="Edit (E)" aria-keyshortcuts="e" className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
        <TaskActionsMenu task={task} onDelete={onDelete} triggerClassName="h-9 w-9 border border-input p-0" />
      </div>
    </div>
  );
}
