import { useState, type ReactNode, type SyntheticEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Ban, Clock, Paperclip, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';
import { can, canTransition } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useChangeTaskStatus, useEpics } from '@/services/apis/tasks/use-tasks';
import type { EpicSummary, Task, TaskStatus } from '@/types';
import { TaskActionsMenu } from './task-actions-menu';
import { DueDateChip, TaskTypeIcon } from './task-badges';
import { BOARD_COLUMNS, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, getBoardColumn, getLabelColor } from './task-config';

type DropState = 'idle' | 'origin' | 'allowed' | 'blocked';

// Prefer the column under the pointer; fall back to overlap (keyboard dragging has no pointer)
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

// Keeps clicks, key presses and pointer-downs inside the "…" menu from opening the card or starting a drag
const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

function AssigneeAvatar({ userId }: { userId: string }) {
  const user = getUserById(userId);
  const name = user?.name ?? 'Unassigned';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Avatar className="h-7 w-7 ring-2 ring-white">
          {user?.avatar && <AvatarImage src={user.avatar} alt={name} />}
          <AvatarFallback className="bg-indigo-100 text-[11px] font-semibold text-indigo-700">{getInitials(name)}</AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
}

/* ---------- Card ---------- */

interface CardContentProps {
  task: Task;
  epic?: EpicSummary;
  menu?: ReactNode;
}

function BoardCardContent({ task, epic, menu }: CardContentProps) {
  const priority = TASK_PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priority.icon;
  const isBlocked = task.isBlocked && task.status !== 'done';

  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-h-[20px] flex-wrap gap-1">
          {task.labels.map((label) => (
            <span key={label} className={cn('rounded px-1.5 py-0.5 text-[11px] font-semibold', getLabelColor(label))}>
              {label}
            </span>
          ))}
        </div>
        {menu}
      </div>

      <p className={cn('mt-1.5 line-clamp-3 text-sm font-medium leading-snug', task.status === 'done' ? 'text-gray-500' : 'text-gray-900')}>
        {task.title}
      </p>

      {epic && (
        <p className="mt-2 flex items-center gap-1 truncate text-xs font-medium text-purple-700">
          <Zap className="h-3 w-3 shrink-0" />
          <span className="truncate">{epic.title}</span>
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <DueDateChip task={task} />
        {task.status === 'reopened' && (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TASK_STATUS_CONFIG.reopened.className)}>Reopened</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-gray-500">
          <TaskTypeIcon type={task.type} />
          <span className={cn('font-semibold', task.status === 'done' ? 'text-gray-400 line-through' : 'text-[#464EB8]')}>{task.key}</span>
          <span title={`${priority.label} priority`} className={priority.className}>
            <PriorityIcon className="h-4 w-4" />
          </span>
          {isBlocked && (
            <span title={task.blockedReason ?? 'Blocked'} className="text-red-600">
              <Ban className="h-4 w-4" />
            </span>
          )}
          {task.estimateHours !== undefined && (
            <span className="inline-flex items-center gap-0.5" title="Logged / estimated hours">
              <Clock className="h-3.5 w-3.5" />
              {task.loggedHours}/{task.estimateHours}h
            </span>
          )}
          {task.attachments.length > 0 && (
            <span className="inline-flex items-center gap-0.5" title="Attachments">
              <Paperclip className="h-3.5 w-3.5" />
              {task.attachments.length}
            </span>
          )}
        </div>
        <AssigneeAvatar userId={task.assigneeId} />
      </div>
    </>
  );
}

const cardClass = (task: Task) =>
  cn(
    'rounded-lg border border-gray-200 bg-white p-3 shadow-sm',
    task.isBlocked && task.status !== 'done' && 'border-l-4 border-l-red-500',
  );

interface BoardCardProps {
  task: Task;
  epic?: EpicSummary;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function BoardCard({ task, epic, onEdit, onDelete }: BoardCardProps) {
  const { user } = useAuth();
  const canDrag = can(user, 'task.changeStatus', task);
  const canEdit = can(user, 'task.edit', task);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task }, disabled: !canDrag });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.key}: ${task.title}`}
      onClick={canEdit ? () => onEdit(task) : undefined}
      className={cn(
        cardClass(task),
        'group transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/50',
        canDrag ? 'cursor-grab active:cursor-grabbing' : canEdit ? 'cursor-pointer' : 'cursor-default',
        isDragging && 'opacity-40',
      )}
    >
      <BoardCardContent
        task={task}
        epic={epic}
        menu={
          <div onClick={stopPropagation} onPointerDown={stopPropagation} onKeyDown={stopPropagation}>
            <TaskActionsMenu
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              triggerClassName="h-6 w-6 p-0 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            />
          </div>
        }
      />
    </div>
  );
}

/* ---------- Column ---------- */

interface BoardColumnProps {
  status: TaskStatus;
  label: string;
  dotClass: string;
  count: number;
  dropState: DropState;
  onCreate?: () => void;
  children: ReactNode;
}

function BoardColumn({ status, label, dotClass, count, dropState, onCreate, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${label} column`}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl bg-indigo-50/60 p-3 transition-colors xl:w-auto xl:min-w-0 xl:flex-1',
        dropState === 'allowed' && 'bg-indigo-50 outline-dashed outline-2 outline-[#464EB8]/30',
        dropState === 'allowed' && isOver && 'bg-indigo-100/70 outline-[#464EB8]',
        dropState === 'blocked' && 'opacity-50',
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
          <span className={cn('h-2 w-2 rounded-full', dotClass)} />
          {label}
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500">{count}</span>
        </h3>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            aria-label="Create task"
            className="rounded p-1 text-gray-500 hover:bg-white hover:text-[#464EB8]"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex min-h-[120px] flex-1 flex-col gap-2.5">
        {children}
        {count === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-indigo-100 py-6 text-xs text-gray-400">
            {dropState === 'blocked' ? 'Not allowed' : dropState === 'allowed' ? 'Drop here' : 'No tasks'}
          </div>
        )}
        {count > 0 && dropState === 'blocked' && <p className="text-center text-xs text-gray-500">Not allowed</p>}
      </div>

      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-3 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-white hover:text-[#464EB8]"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      )}
    </section>
  );
}

/* ---------- Board ---------- */

interface TaskBoardSectionProps {
  tasks: Task[];
  onCreate?: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskBoardSection({ tasks, onCreate, onEdit, onDelete }: TaskBoardSectionProps) {
  const { user } = useAuth();
  const { data: epics = [] } = useEpics();
  const changeStatus = useChangeTaskStatus();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // A small drag distance lets a plain click open the task instead of starting a drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const findEpic = (task: Task) => epics.find((epic) => epic.id === task.epicId);

  const getDropState = (status: TaskStatus): DropState => {
    if (!activeTask) return 'idle';
    if (getBoardColumn(activeTask.status) === status) return 'origin';
    return canTransition(user, activeTask, status) ? 'allowed' : 'blocked';
  };

  const handleDragStart = (event: DragStartEvent) => setActiveTask((event.active.data.current?.task as Task) ?? null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const task = event.active.data.current?.task as Task | undefined;
    const target = event.over?.id as TaskStatus | undefined;
    if (!task || !target || getBoardColumn(task.status) === target) return;

    if (!canTransition(user, task, target)) {
      const needsApproval = task.status === 'in-review' && target === 'done';
      toast.error(
        needsApproval
          ? `${task.key} needs approval from a manager to move to Done`
          : `You can't move ${task.key} to ${TASK_STATUS_CONFIG[target].label}`,
      );
      return;
    }
    changeStatus.mutate({ task, status: target });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="ionixx-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {BOARD_COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => getBoardColumn(task.status) === column.status);
          return (
            <BoardColumn
              key={column.status}
              status={column.status}
              label={column.label}
              dotClass={column.dotClass}
              count={columnTasks.length}
              dropState={getDropState(column.status)}
              onCreate={column.status === 'todo' ? onCreate : undefined}
            >
              {columnTasks.map((task) => (
                <BoardCard key={task.id} task={task} epic={findEpic(task)} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </BoardColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className={cn(cardClass(activeTask), 'w-72 rotate-2 cursor-grabbing shadow-xl ring-2 ring-[#464EB8]/40')}>
            <BoardCardContent task={activeTask} epic={findEpic(activeTask)} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
