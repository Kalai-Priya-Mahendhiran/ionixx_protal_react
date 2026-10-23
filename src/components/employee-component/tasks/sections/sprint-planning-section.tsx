import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { ArrowRightLeft, CalendarRange, GripVertical, Inbox, Play, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { canManageSprints, hasProjectAccess } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useMoveToSprint, useSprints, useStartSprint } from '@/services/apis/tasks/use-tasks';
import type { Project, Sprint, Task } from '@/types';
import { KEYBOARD_OPTIONS, collisionDetection, dropAreaClass, stopPropagation, type DropState } from './board-dnd';
import { CompleteSprintDialog, CreateSprintDialog } from './sprint-dialogs';
import { TaskStatusBadge, TaskTypeIcon } from './task-badges';
import { taskPath } from './task-link';
import { daysUntil, formatShortDate } from './task-utils';

const BACKLOG_ID = 'backlog';

const sumEstimate = (tasks: Task[]) => tasks.reduce((sum, task) => sum + (task.estimateHours ?? 0), 0);

/* ---------- Row ---------- */

interface TaskRowProps {
  task: Task;
  moveTargets: { id: string | null; name: string }[];
  onMove: (task: Task, sprintId: string | null, targetName: string) => void;
  // People who can see but not plan the project's sprints get plain rows
  readOnly?: boolean;
}

function TaskRowContent({ task, menu, readOnly = false }: { task: Task; menu?: ReactNode; readOnly?: boolean }) {
  const location = useLocation();
  const assignee = getUserById(task.assigneeId);
  return (
    <>
      {!readOnly && <GripVertical className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />}
      <TaskTypeIcon type={task.type} />
      <Link
        to={taskPath(task.key)}
        state={{ from: location.search }}
        onPointerDown={stopPropagation}
        className={cn('shrink-0 text-sm font-medium text-[#464EB8] hover:underline', task.status === 'done' && 'line-through')}
      >
        {task.key}
      </Link>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-900" title={task.title}>
        {task.title}
      </span>
      <TaskStatusBadge status={task.status} />
      <span className="w-10 shrink-0 text-right text-xs text-gray-500">{task.estimateHours !== undefined ? `${task.estimateHours}h` : '–'}</span>
      <span
        title={assignee?.name}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
      >
        {getInitials(assignee?.name ?? '?')}
      </span>
      {menu}
    </>
  );
}

function TaskRow({ task, moveTargets, onMove, readOnly = false }: TaskRowProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task }, disabled: readOnly });
  if (readOnly) {
    return (
      <li className="flex items-center gap-2.5 rounded-md border border-gray-200 bg-white px-2.5 py-2">
        <TaskRowContent task={task} readOnly />
      </li>
    );
  }
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`${task.key}: ${task.title}. Press Space to move it.`}
      className={cn(
        'flex cursor-grab items-center gap-2.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 hover:border-[#464EB8]/30 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/50 active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <TaskRowContent
        task={task}
        menu={
          <div onPointerDown={stopPropagation} onKeyDown={stopPropagation} onClick={stopPropagation}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500" aria-label={`Move ${task.key} to another sprint`}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white">
                <DropdownMenuLabel className="text-xs text-gray-500">Move {task.key} to</DropdownMenuLabel>
                {moveTargets.map((target) => (
                  <DropdownMenuItem key={target.id ?? BACKLOG_ID} onSelect={() => onMove(task, target.id, target.name)}>
                    {target.id ? <CalendarRange className="text-gray-500" /> : <Inbox className="text-gray-500" />}
                    {target.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />
    </li>
  );
}

/* ---------- Containers (sprints and backlog) ---------- */

interface PlanningContainerProps {
  id: string;
  dropState: DropState;
  header: ReactNode;
  tasks: Task[];
  emptyText: string;
  moveTargets: { id: string | null; name: string }[];
  onMove: TaskRowProps['onMove'];
  highlight?: boolean;
  readOnly?: boolean;
}

function PlanningContainer({ id, dropState, header, tasks, emptyText, moveTargets, onMove, highlight, readOnly }: PlanningContainerProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      className={cn('rounded-xl border bg-white p-4 shadow-sm transition-colors', highlight ? 'border-[#464EB8]/40' : 'border-gray-200', dropAreaClass(dropState, isOver))}
    >
      {header}
      <ul className="mt-3 space-y-1.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} readOnly={readOnly} moveTargets={moveTargets.filter((target) => (target.id ?? BACKLOG_ID) !== id)} onMove={onMove} />
        ))}
      </ul>
      {tasks.length === 0 && (
        <p className="rounded-md border-2 border-dashed border-gray-200 px-3 py-4 text-center text-sm text-gray-400">
          {dropState === 'allowed' ? 'Drop here' : readOnly ? 'No tasks' : emptyText}
        </p>
      )}
    </section>
  );
}

function SprintMeta({ sprint, tasks }: { sprint: Sprint; tasks: Task[] }) {
  const daysLeft = daysUntil(sprint.endDate);
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
      <span className="inline-flex items-center gap-1">
        <CalendarRange className="h-4 w-4" />
        {formatShortDate(sprint.startDate)} – {formatShortDate(sprint.endDate)}
      </span>
      {sprint.status === 'active' && (
        <span className={cn('font-medium', daysLeft < 0 ? 'text-red-700' : daysLeft <= 2 ? 'text-amber-700' : 'text-gray-600')}>
          {daysLeft < 0 ? `${Math.abs(daysLeft)}d past end` : daysLeft === 0 ? 'Ends today' : `${daysLeft}d left`}
        </span>
      )}
      <span>
        {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} · {sumEstimate(tasks)}h estimated
      </span>
    </span>
  );
}

/* ---------- Section ---------- */

interface SprintPlanningSectionProps {
  // Visible top-level tasks
  tasks: Task[];
  projects: Project[];
}

export function SprintPlanningSection({ tasks, projects }: SprintPlanningSectionProps) {
  const { user } = useAuth();
  const { data: sprints = [], isLoading } = useSprints();
  const moveToSprint = useMoveToSprint();
  const startSprint = useStartSprint();
  // Everyone sees the sprints of projects they can access; planning controls only show where they may plan
  const viewable = projects.filter((project) => canManageSprints(user, project) || hasProjectAccess(user, project));
  const [projectId, setProjectId] = useState<string | undefined>();
  const [createFor, setCreateFor] = useState<Project | null>(null);
  const [completing, setCompleting] = useState<Sprint | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, KEYBOARD_OPTIONS));

  const project = viewable.find((item) => item.id === projectId) ?? viewable[0];
  if (!project) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-gray-600">You aren't a member of any project yet, so there are no sprints to show.</CardContent>
      </Card>
    );
  }
  const canPlan = canManageSprints(user, project);

  const projectSprints = sprints.filter((sprint) => sprint.projectId === project.id);
  const active = projectSprints.find((sprint) => sprint.status === 'active');
  const planned = projectSprints.filter((sprint) => sprint.status === 'planned').sort((a, b) => a.startDate.localeCompare(b.startDate));
  // Epics span several sprints, so they're planned through their child tasks, not moved themselves
  const projectTasks = tasks.filter((task) => task.projectId === project.id && !task.parentId && task.type !== 'epic');
  const openSprintIds = new Set([active?.id, ...planned.map((sprint) => sprint.id)]);
  const tasksIn = (sprintId: string) => projectTasks.filter((task) => task.sprintId === sprintId);
  // Unplanned work, plus anything still pointing at a completed sprint
  const backlog = projectTasks.filter((task) => task.status !== 'done' && (!task.sprintId || !openSprintIds.has(task.sprintId)));

  const moveTargets = [
    ...(active ? [{ id: active.id, name: active.name }] : []),
    ...planned.map((sprint) => ({ id: sprint.id, name: sprint.name })),
    { id: null, name: 'Backlog' },
  ];

  const containerOf = (task: Task) => (task.sprintId && openSprintIds.has(task.sprintId) ? task.sprintId : BACKLOG_ID);
  const dropStateFor = (id: string): DropState => (!activeTask ? 'idle' : containerOf(activeTask) === id ? 'origin' : 'allowed');

  const move = (task: Task, sprintId: string | null, targetName: string) => moveToSprint.mutate({ task, sprintId, targetName });

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const task = event.active.data.current?.task as Task | undefined;
    const overId = event.over ? String(event.over.id) : null;
    if (!task || !overId || containerOf(task) === overId) return;
    const target = moveTargets.find((item) => (item.id ?? BACKLOG_ID) === overId);
    if (target) move(task, target.id, target.name);
  };

  const done = active ? tasksIn(active.id).filter((task) => task.status === 'done').length : 0;
  const activeTotal = active ? tasksIn(active.id).length : 0;
  const activePercent = activeTotal ? Math.round((done / activeTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {viewable.length > 1 ? (
            <Select value={project.id} onValueChange={setProjectId}>
              <SelectTrigger className="w-56 bg-white" aria-label="Project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {viewable.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
          )}
          <p className="hidden text-sm text-gray-500 md:block">
            {canPlan ? 'Drag tasks between the backlog and sprints, or use the move button on a row.' : 'View only — project members and leads plan these sprints.'}
          </p>
        </div>
        {canPlan && (
          <Button onClick={() => setCreateFor(project)} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            <Plus className="h-4 w-4" />
            Create sprint
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={(event) => setActiveTask((event.active.data.current?.task as Task) ?? null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTask(null)}
        >
          <div className="space-y-4">
            {active ? (
              <PlanningContainer
                id={active.id}
                dropState={dropStateFor(active.id)}
                highlight
                readOnly={!canPlan}
                tasks={tasksIn(active.id)}
                emptyText="No tasks in this sprint yet"
                moveTargets={moveTargets}
                onMove={move}
                header={
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                          {active.name}
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Active</span>
                        </h3>
                        <SprintMeta sprint={active} tasks={tasksIn(active.id)} />
                        {active.goal && (
                          <p className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Target className="h-4 w-4 text-[#464EB8]" />
                            {active.goal}
                          </p>
                        )}
                      </div>
                      {canPlan && (
                        <Button variant="outline" onClick={() => setCompleting(active)}>
                          Complete sprint
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${activePercent}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {done}/{activeTotal} done
                      </span>
                    </div>
                  </div>
                }
              />
            ) : (
              <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-sm text-gray-600">
                {canPlan ? <>No sprint is running. Start a planned sprint below{planned.length === 0 && ', or create one first'}.</> : 'No sprint is running.'}
              </p>
            )}

            {planned.map((sprint) => (
              <PlanningContainer
                key={sprint.id}
                id={sprint.id}
                dropState={dropStateFor(sprint.id)}
                readOnly={!canPlan}
                tasks={tasksIn(sprint.id)}
                emptyText="Drag tasks here from the backlog"
                moveTargets={moveTargets}
                onMove={move}
                header={
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                        {sprint.name}
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Planned</span>
                      </h3>
                      <SprintMeta sprint={sprint} tasks={tasksIn(sprint.id)} />
                      {sprint.goal && <p className="text-sm text-gray-700">{sprint.goal}</p>}
                    </div>
                    {canPlan && (
                    <Button
                      variant="outline"
                      onClick={() => startSprint.mutate(sprint)}
                      disabled={!!active || startSprint.isPending}
                      title={active ? `Complete ${active.name} first` : undefined}
                      className="gap-1.5"
                    >
                      <Play className="h-4 w-4" />
                      Start sprint
                    </Button>
                    )}
                  </div>
                }
              />
            ))}

            <PlanningContainer
              id={BACKLOG_ID}
              dropState={dropStateFor(BACKLOG_ID)}
              readOnly={!canPlan}
              tasks={backlog}
              emptyText="The backlog is empty"
              moveTargets={moveTargets}
              onMove={move}
              header={
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Inbox className="h-4 w-4 text-gray-500" />
                    Backlog
                  </h3>
                  <p className="text-sm text-gray-500">
                    {backlog.length} unplanned {backlog.length === 1 ? 'task' : 'tasks'} · {sumEstimate(backlog)}h estimated
                  </p>
                </div>
              }
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div className="flex w-[640px] max-w-[90vw] items-center gap-2.5 rounded-md border border-[#464EB8]/40 bg-white px-2.5 py-2 shadow-xl">
                <TaskRowContent task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <CreateSprintDialog project={createFor} sprints={sprints} onOpenChange={(open) => !open && setCreateFor(null)} />
      <CompleteSprintDialog
        sprint={completing}
        sprintTasks={completing ? tasksIn(completing.id) : []}
        plannedSprints={planned}
        onOpenChange={(open) => !open && setCompleting(null)}
      />
    </div>
  );
}
