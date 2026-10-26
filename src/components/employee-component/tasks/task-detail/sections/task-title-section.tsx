import { Ban, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetBlocked } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { OnLeaveBanner } from '@/components/employee-component/tasks/sections/leave-warning';
import { InlineText } from './inline-fields';
import type { SaveField } from './task-detail-meta';

interface TaskTitleSectionProps {
  task: Task;
  canEdit: boolean;
  canChangeStatus: boolean;
  canLogWork: boolean;
  isBlocked: boolean;
  saveField: SaveField;
  onLogWork: () => void;
  onFlag: () => void;
}

// Title, leave and blocked banners, and the quick actions under them
export function TaskTitleSection({ task, canEdit, canChangeStatus, canLogWork, isBlocked, saveField, onLogWork, onFlag }: TaskTitleSectionProps) {
  const setBlocked = useSetBlocked();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold leading-tight text-gray-900">
        <InlineText
          value={task.title}
          onSave={(title) => saveField('Title', { title })}
          editable={canEdit}
          ariaLabel="Title"
          maxLength={200}
          inputClassName="h-11 text-xl font-semibold"
          validate={(value) => (value ? undefined : 'Give the task a title')}
        />
      </h1>

      <OnLeaveBanner userId={task.assigneeId} date={task.dueDate} hidden={task.status === 'done'} />

      {isBlocked && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Blocked</p>
            {task.blockedReason && <p className="text-red-700">{task.blockedReason}</p>}
          </div>
          {canChangeStatus && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBlocked.mutate({ task, blocked: false })}
              disabled={setBlocked.isPending}
              className="border-red-200 bg-white text-red-700 hover:bg-red-100"
            >
              Remove flag
            </Button>
          )}
        </div>
      )}

      {(canLogWork || (canChangeStatus && !isBlocked && task.status !== 'done')) && (
        <div className="flex flex-wrap gap-2">
          {canLogWork && (
            <Button size="sm" variant="outline" onClick={onLogWork} className="gap-1.5">
              <Clock className="h-4 w-4" />
              Log work
            </Button>
          )}
          {canChangeStatus && !isBlocked && task.status !== 'done' && (
            <Button size="sm" variant="outline" onClick={onFlag} className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800">
              <Ban className="h-4 w-4" />
              Flag as blocked / Request help
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
