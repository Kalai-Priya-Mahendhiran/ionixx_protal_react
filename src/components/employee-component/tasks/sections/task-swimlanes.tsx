import { useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { canReassign, firstAllowedStatus } from '@/lib/permissions/task-permissions';
import { getColumnStatuses } from '@/lib/workflow';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useChangeTaskStatus, useEpics, useReassignTask } from '@/services/apis/tasks/use-tasks';
import type { Task, TaskStatus } from '@/types';
import { KEYBOARD_OPTIONS, cardClass, collisionDetection, dropAreaClass, type DropState } from './board-dnd';
import { BoardCard, BoardCardContent } from './task-board-section';
import { getBoardColumn, getBoardColumns, getStatusMeta } from './task-config';
import { getWorkload, type SubtaskProgress } from './task-utils';
import { useWorkloadThreshold } from './use-workload-threshold';

// Each cell is a drop target identified by "<assigneeId>::<status>"
const cellId = (assigneeId: string, status: TaskStatus) => `${assigneeId}::${status}`;
const parseCellId = (id: string) => {
  const [assigneeId, status] = id.split('::');
  return { assigneeId, status: status as TaskStatus };
};

function LaneCell({ id, dropState, children, empty }: { id: string; dropState: DropState; children: ReactNode; empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn('flex min-h-[96px] flex-col gap-2.5 rounded-lg bg-indigo-50/50 p-2 transition-colors', dropAreaClass(dropState, isOver))}
    >
      {children}
      {empty && dropState !== 'idle' && dropState !== 'origin' && (
        <span className="m-auto text-xs text-gray-400">{dropState === 'blocked' ? 'Not allowed' : 'Drop here'}</span>
      )}
    </div>
  );
}

interface TaskSwimlanesProps {
  tasks: Task[];
  // People shown as rows, in order (people without tasks still get a row to drop work on)
  laneUserIds: string[];
  // Unfiltered team work, so lane hours don't change with the search box
  workloadTasks: Task[];
  // Opened from Workload: show this person's lane, collapse the rest
  focusUserId?: string;
  subtaskProgress: Map<string, SubtaskProgress>;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskSwimlanes({ tasks, laneUserIds, workloadTasks, focusUserId, subtaskProgress, onOpen, onEdit, onDelete }: TaskSwimlanesProps) {
  const { user } = useAuth();
  const { data: epics = [] } = useEpics();
  const changeStatus = useChangeTaskStatus();
  const reassign = useReassignTask();
  const [threshold] = useWorkloadThreshold();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(focusUserId ? laneUserIds.filter((id) => id !== focusUserId) : []));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, KEYBOARD_OPTIONS));

  // Anyone holding visible work gets a lane too, after the team
  const laneIds = [...laneUserIds, ...tasks.map((task) => task.assigneeId).filter((id) => !laneUserIds.includes(id))].filter(
    (id, index, all) => all.indexOf(id) === index,
  );
  const workload = new Map(getWorkload(workloadTasks, laneIds).map((row) => [row.userId, row]));
  const findEpic = (task: Task) => epics.find((epic) => epic.id === task.epicId);

  // A cell is a person × column; the column may hold several statuses, so pick the first reachable one
  const getDropState = (assigneeId: string, column: TaskStatus): DropState => {
    if (!activeTask) return 'idle';
    const sameLane = activeTask.assigneeId === assigneeId;
    const sameColumn = getBoardColumn(activeTask.status) === column;
    if (sameLane && sameColumn) return 'origin';
    const statusOk = sameColumn || !!firstAllowedStatus(user, activeTask, getColumnStatuses(column));
    const laneOk = sameLane || canReassign(user, activeTask, assigneeId);
    return statusOk && laneOk ? 'allowed' : 'blocked';
  };

  const handleDragStart = (event: DragStartEvent) => setActiveTask((event.active.data.current?.task as Task) ?? null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const task = event.active.data.current?.task as Task | undefined;
    if (!task || !event.over) return;
    const { assigneeId, status: column } = parseCellId(String(event.over.id));
    const sameLane = task.assigneeId === assigneeId;
    const sameColumn = getBoardColumn(task.status) === column;
    if (sameLane && sameColumn) return;

    const name = getUserById(assigneeId)?.name ?? 'this person';
    if (!sameLane && !canReassign(user, task, assigneeId)) {
      toast.error(`You can't assign ${task.key} to ${name}`);
      return;
    }
    const status = sameColumn ? undefined : firstAllowedStatus(user, task, getColumnStatuses(column));
    if (!sameColumn && !status) {
      toast.error(`You can't move ${task.key} to ${getStatusMeta(column).label}`);
      return;
    }
    if (sameLane && status) changeStatus.mutate({ task, status });
    else reassign.mutate({ task, assigneeId, assigneeName: name, status });
  };

  const toggleLane = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="app-scrollbar overflow-x-auto pb-2">
        <div className="min-w-[1000px] space-y-3">
          {/* Column headings */}
          <div className="grid grid-cols-4 gap-3 px-1">
            {getBoardColumns().map((column) => (
              <h3 key={column.status} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <span className={cn('h-2 w-2 rounded-full', column.dotClass)} />
                {column.label}
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-500 shadow-sm">
                  {tasks.filter((task) => getBoardColumn(task.status) === column.status).length}
                </span>
              </h3>
            ))}
          </div>

          {laneIds.map((assigneeId) => {
            const person = getUserById(assigneeId);
            const laneTasks = tasks.filter((task) => task.assigneeId === assigneeId);
            const load = workload.get(assigneeId);
            const overloaded = !!load && load.remainingHours > threshold;
            const isCollapsed = collapsed.has(assigneeId);
            return (
              <section key={assigneeId} aria-label={`${person?.name ?? 'Unknown'}'s tasks`} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleLane(assigneeId)}
                  aria-expanded={!isCollapsed}
                  className="mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-gray-50"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700">
                    {getInitials(person?.name ?? '?')}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {person?.name ?? 'Unknown user'}
                    {assigneeId === user?.id && <span className="font-normal text-gray-500"> (me)</span>}
                  </span>
                  <span className="text-sm text-gray-500">
                    · {load?.openTasks ?? 0} open · {load?.remainingHours ?? 0}h remaining
                  </span>
                  {overloaded && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Overloaded</span>
                  )}
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-4 gap-3">
                    {getBoardColumns().map((column) => {
                      const cellTasks = laneTasks.filter((task) => getBoardColumn(task.status) === column.status);
                      return (
                        <LaneCell
                          key={column.status}
                          id={cellId(assigneeId, column.status)}
                          dropState={getDropState(assigneeId, column.status)}
                          empty={cellTasks.length === 0}
                        >
                          {cellTasks.map((task) => (
                            <BoardCard
                              key={task.id}
                              task={task}
                              epic={findEpic(task)}
                              progress={subtaskProgress.get(task.id)}
                              onOpen={onOpen}
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          ))}
                        </LaneCell>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className={cn(cardClass(activeTask), 'w-64 rotate-2 cursor-grabbing shadow-xl ring-2 ring-[#464EB8]/40')}>
            <BoardCardContent task={activeTask} epic={findEpic(activeTask)} progress={subtaskProgress.get(activeTask.id)} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
