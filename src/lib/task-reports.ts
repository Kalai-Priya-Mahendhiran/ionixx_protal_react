import { sampleWeeklyHistory } from '@/lib/sample-data/report-history-sample-data';
import { toDateInput } from '@/lib/utils';
import type { Project, Sprint, Task } from '@/types';

/*
 * Numbers for the executive dashboard and project summaries. Pure functions over the tasks a
 * user can see, so they're easy to test and identical wherever they're shown.
 * With the backend these come from GET /api/reports/tasks/* computed server-side.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RISK_PRIORITIES = new Set<Task['priority']>(['high', 'urgent']);

// Work items that count towards progress: top-level, and not epics (they're containers)
export const countsTowardsProgress = (task: Task) => !task.parentId && task.type !== 'epic';

const dayOf = (iso: string) => iso.slice(0, 10);

function parseDay(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const shortDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function isOverdue(task: Task, today: Date = new Date()): boolean {
  return task.status !== 'done' && task.dueDate < toDateInput(today);
}

/* ---------- Headline numbers ---------- */

export interface TaskSummary {
  total: number;
  done: number;
  open: number;
  overdue: number;
  blocked: number;
  percentComplete: number;
}

export function summarize(tasks: Task[], today: Date = new Date()): TaskSummary {
  const work = tasks.filter(countsTowardsProgress);
  const done = work.filter((task) => task.status === 'done').length;
  const open = work.length - done;
  return {
    total: work.length,
    done,
    open,
    overdue: work.filter((task) => isOverdue(task, today)).length,
    blocked: work.filter((task) => task.isBlocked && task.status !== 'done').length,
    percentComplete: work.length === 0 ? 0 : Math.round((done / work.length) * 100),
  };
}

// Work items that reached Done in the 7 days up to now
export function finishedInLastWeek(tasks: Task[], today: Date = new Date()): number {
  return tasks.filter(
    (task) => countsTowardsProgress(task) && task.status === 'done' && !!task.completedAt && today.getTime() - new Date(task.completedAt).getTime() <= 7 * MS_PER_DAY,
  ).length;
}

/* ---------- Projects ---------- */

export interface ProjectProgress extends TaskSummary {
  project: Project;
}

export function getProjectProgress(tasks: Task[], projects: Project[], today: Date = new Date()): ProjectProgress[] {
  return projects
    .map((project) => ({ project, ...summarize(tasks.filter((task) => task.projectId === project.id), today) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

/* ---------- Throughput per week ---------- */

export interface WeekThroughput {
  weekStart: string; // Monday, YYYY-MM-DD
  label: string; // e.g. "Oct 12", or "This week" (still in progress)
  created: number;
  completed: number;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - offset);
  return start;
}

// The last `weeks` weeks (oldest first): pre-demo history plus what live tasks show
export function getWeeklyThroughput(tasks: Task[], weeks = 9, today: Date = new Date(), history = sampleWeeklyHistory): WeekThroughput[] {
  const thisWeek = startOfWeek(today);
  const work = tasks.filter(countsTowardsProgress);
  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - (weeks - 1 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const [from, to] = [toDateInput(start), toDateInput(end)];
    const inWeek = (iso?: string) => !!iso && dayOf(iso) >= from && dayOf(iso) < to;
    // History lines up so its last entry is the week before the current one
    const weeksAgo = weeks - 1 - index;
    const past = weeksAgo > 0 ? history[history.length - weeksAgo] : undefined;
    return {
      weekStart: from,
      label: weeksAgo === 0 ? 'This week' : shortDate(start),
      created: work.filter((task) => inWeek(task.createdAt)).length + (past?.created ?? 0),
      completed: work.filter((task) => inWeek(task.completedAt)).length + (past?.completed ?? 0),
    };
  });
}

/* ---------- Sprint burndown ---------- */

export interface BurndownPoint {
  date: string;
  label: string;
  ideal: number;
  // Remaining at the end of that day; null for days still to come
  remaining: number | null;
}

export interface Burndown {
  sprint: Sprint;
  scope: number;
  remaining: number;
  points: BurndownPoint[];
}

// Remaining = tasks in the sprint not yet finished by the end of each day (scope is the sprint's current tasks)
export function getBurndown(tasks: Task[], sprint: Sprint, today: Date = new Date()): Burndown {
  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id && countsTowardsProgress(task));
  const scope = sprintTasks.length;
  const start = parseDay(sprint.startDate);
  const totalDays = Math.max(1, Math.round((parseDay(sprint.endDate).getTime() - start.getTime()) / MS_PER_DAY));
  const todayKey = toDateInput(today);

  const points = Array.from({ length: totalDays + 1 }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    const key = toDateInput(day);
    const finished = sprintTasks.filter((task) => task.status === 'done' && task.completedAt && dayOf(task.completedAt) <= key).length;
    return {
      date: key,
      label: shortDate(day),
      ideal: Math.round((scope - (scope * index) / totalDays) * 10) / 10,
      remaining: key <= todayKey ? scope - finished : null,
    };
  });
  return { sprint, scope, remaining: sprintTasks.filter((task) => task.status !== 'done').length, points };
}

/* ---------- Risks ---------- */

// High or urgent work that is overdue or blocked; urgent first, then the most overdue
export function getRisks(tasks: Task[], today: Date = new Date()): Task[] {
  return tasks
    .filter((task) => countsTowardsProgress(task) && RISK_PRIORITIES.has(task.priority) && task.status !== 'done' && (isOverdue(task, today) || task.isBlocked))
    .sort((a, b) => Number(b.priority === 'urgent') - Number(a.priority === 'urgent') || a.dueDate.localeCompare(b.dueDate));
}

/* ---------- Epics ---------- */

export interface EpicProgress {
  epic: Task;
  total: number;
  done: number;
  percent: number;
}

export function getEpicProgress(tasks: Task[]): EpicProgress[] {
  return tasks
    .filter((task) => task.type === 'epic')
    .map((epic) => {
      const children = tasks.filter((task) => task.epicId === epic.id && !task.parentId);
      const done = children.filter((task) => task.status === 'done').length;
      return { epic, total: children.length, done, percent: children.length === 0 ? 0 : Math.round((done / children.length) * 100) };
    });
}
