import { ArrowRightLeft, Copy, Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { can, canCreateTask, canTransition } from '@/lib/permissions/task-permissions';
import { TASK_WORKFLOW_STATUSES } from '@/lib/schemas';
import { useChangeTaskStatus, useDuplicateTask } from '@/services/apis/tasks/use-tasks';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUS_CONFIG } from './task-config';
import { copyTaskLink } from './task-link';

interface TaskActionsMenuProps {
  task: Task;
  onDelete: (task: Task) => void;
  // Adds an "Edit" item, for layouts without a separate Edit button (e.g. board cards)
  onEdit?: (task: Task) => void;
  triggerClassName?: string;
}

export function TaskActionsMenu({ task, onDelete, onEdit, triggerClassName }: TaskActionsMenuProps) {
  const { user } = useAuth();
  const changeStatus = useChangeTaskStatus();
  const duplicateTask = useDuplicateTask();

  const canEdit = !!onEdit && can(user, 'task.edit', task);
  const canChangeStatus = can(user, 'task.changeStatus', task);
  const canDuplicate = canCreateTask(user, task);
  const canDelete = can(user, 'task.delete', task);

  // Non-modal so opening the delete confirmation from the menu doesn't leave the page unclickable
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`More actions for ${task.key}`} className={triggerClassName}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white">
        <DropdownMenuItem onSelect={() => void copyTaskLink(task)}>
          <Link2 className="text-gray-500" />
          Copy link
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onSelect={() => onEdit(task)}>
            <Pencil className="text-gray-500" />
            Edit
          </DropdownMenuItem>
        )}
        {canChangeStatus && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightLeft className="text-gray-500" />
              Change status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-white">
              <DropdownMenuRadioGroup
                value={task.status}
                onValueChange={(status) => {
                  if (status !== task.status) changeStatus.mutate({ task, status: status as TaskStatus });
                }}
              >
                {TASK_WORKFLOW_STATUSES.map((status) => (
                  <DropdownMenuRadioItem
                    key={status}
                    value={status}
                    disabled={status !== task.status && !canTransition(user, task, status)}
                  >
                    {TASK_STATUS_CONFIG[status].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {canDuplicate && (
          <DropdownMenuItem onSelect={() => duplicateTask.mutate(task)}>
            <Copy className="text-gray-500" />
            Duplicate
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            {(canChangeStatus || canDuplicate) && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => onDelete(task)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
