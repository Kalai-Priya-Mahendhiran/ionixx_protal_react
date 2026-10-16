import type { TaskView } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { toDateInput } from '@/lib/utils';
import type { Task } from '@/types';

export type TaskStatusFilter = 'all' | 'todo' | 'in-progress' | 'in-review' | 'done' | 'blocked';

// Filter buttons; "Blocked" is applied from its stat card
export const STATUS_FILTER_OPTIONS: { value: TaskStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

// Due within this many days (and not done) shows the orange "due soon" chip
export const DUE_SOON_DAYS = 2;

export function matchesStatusFilter(task: Task, filter: TaskStatusFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'todo':
      // Reopened work is back in the to-do pile
      return task.status === 'todo' || task.status === 'reopened';
    case 'blocked':
      return task.isBlocked && task.status !== 'done';
    default:
      return task.status === filter;
  }
}

export function countByStatusFilter(tasks: Task[]): Record<TaskStatusFilter, number> {
  const filters: TaskStatusFilter[] = ['all', 'todo', 'in-progress', 'in-review', 'done', 'blocked'];
  return Object.fromEntries(
    filters.map((filter) => [filter, tasks.filter((task) => matchesStatusFilter(task, filter)).length]),
  ) as Record<TaskStatusFilter, number>;
}

// Matches key, title, description, labels and people's names
export function matchesSearch(task: Task, term: string): boolean {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    task.key,
    task.title,
    task.description,
    ...task.labels,
    getUserById(task.assigneeId)?.name ?? '',
    getUserById(task.reporterId)?.name ?? '',
  ];
  return haystack.some((value) => value.toLowerCase().includes(query));
}

// Narrows the already permission-filtered task list to what the current view is about
// Sub-tasks never appear on their own here: they're shown inside their parent
export function filterTasksForView(view: TaskView, tasks: Task[], userId: string): Task[] {
  const topLevel = tasks.filter((task) => !task.parentId);
  switch (view) {
    case 'my-tasks':
      return topLevel.filter(
        (task) => task.assigneeId === userId || task.reporterId === userId || task.watcherIds.includes(userId),
      );
    case 'hr-tasks':
      return topLevel.filter((task) => task.type === 'hr');
    default:
      return topLevel;
  }
}

/* ---------- My Tasks tabs ---------- */

export type MyTasksTab = 'assigned' | 'created' | 'watching' | 'completed';

export const MY_TASKS_TABS: { value: MyTasksTab; label: string }[] = [
  { value: 'assigned', label: 'Assigned to me' },
  { value: 'created', label: 'Created by me' },
  { value: 'watching', label: 'Watching' },
  { value: 'completed', label: 'Completed' },
];

export function isMyTasksTab(value: string | null): value is MyTasksTab {
  return MY_TASKS_TABS.some((tab) => tab.value === value);
}

// Open work in the first three tabs; finished work assigned to me in "Completed"
export function matchesMyTasksTab(task: Task, tab: MyTasksTab, userId: string): boolean {
  switch (tab) {
    case 'assigned':
      return task.assigneeId === userId && task.status !== 'done';
    case 'created':
      return task.reporterId === userId && task.status !== 'done';
    case 'watching':
      return task.watcherIds.includes(userId) && task.status !== 'done';
    case 'completed':
      return task.assigneeId === userId && task.status === 'done';
  }
}

/* ---------- Sub-tasks ---------- */

export interface SubtaskProgress {
  done: number;
  total: number;
}

// Done / total sub-tasks per parent ID
export function getSubtaskProgress(tasks: Task[]): Map<string, SubtaskProgress> {
  const progress = new Map<string, SubtaskProgress>();
  tasks.forEach((task) => {
    if (!task.parentId) return;
    const current = progress.get(task.parentId) ?? { done: 0, total: 0 };
    progress.set(task.parentId, { done: current.done + (task.status === 'done' ? 1 : 0), total: current.total + 1 });
  });
  return progress;
}

export const progressPercent = ({ done, total }: SubtaskProgress) => (total === 0 ? 0 : Math.round((done / total) * 100));

export type DueState = 'overdue' | 'due-soon' | 'upcoming' | 'done';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Whole days from today until the due date (negative when overdue)
export function daysUntil(dueDate: string, today: Date = new Date()): number {
  return Math.round((Date.parse(dueDate) - Date.parse(toDateInput(today))) / MS_PER_DAY);
}

export function getDueState(task: Pick<Task, 'dueDate' | 'status'>, today: Date = new Date()): DueState {
  if (task.status === 'done') return 'done';
  const days = daysUntil(task.dueDate, today);
  if (days < 0) return 'overdue';
  return days <= DUE_SOON_DAYS ? 'due-soon' : 'upcoming';
}

// Parses YYYY-MM-DD as a local date (new Date('YYYY-MM-DD') would be UTC midnight)
export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatShortDate(value: string): string {
  return parseDateInput(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calendar days from start to due, counting both ends (same day = 1 day)
export function getDurationDays(startDate: string, dueDate: string): number {
  return Math.round((Date.parse(dueDate) - Date.parse(startDate)) / MS_PER_DAY) + 1;
}

export function parseLabels(value: string): string[] {
  return [...new Set(value.split(',').map((label) => label.trim()).filter(Boolean))];
}

/* ---------- Manager tools ---------- */

export const DEFAULT_WORKLOAD_THRESHOLD = 40;

export interface WorkloadRow {
  userId: string;
  openTasks: number;
  estimateHours: number;
  loggedHours: number;
  // Estimate minus logged on open work: what this person still has to do
  remainingHours: number;
  overdue: number;
  blocked: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

// Open (not done) top-level work per person. Sub-tasks are part of their parent's estimate, and
// epics are left out: their estimate covers the whole initiative, not one person's work
export function getWorkload(tasks: Task[], userIds: string[], today: Date = new Date()): WorkloadRow[] {
  return userIds.map((userId) => {
    const open = tasks.filter((task) => !task.parentId && task.type !== 'epic' && task.assigneeId === userId && task.status !== 'done');
    const estimateHours = open.reduce((sum, task) => sum + (task.estimateHours ?? 0), 0);
    const loggedHours = open.reduce((sum, task) => sum + task.loggedHours, 0);
    const remainingHours = open.reduce((sum, task) => sum + Math.max(0, (task.estimateHours ?? 0) - task.loggedHours), 0);
    return {
      userId,
      openTasks: open.length,
      estimateHours: round(estimateHours),
      loggedHours: round(loggedHours),
      remainingHours: round(remainingHours),
      overdue: open.filter((task) => getDueState(task, today) === 'overdue').length,
      blocked: open.filter((task) => task.isBlocked).length,
    };
  });
}

export interface TeamAlerts {
  overdue: Task[];
  blocked: Task[];
}

// Open top-level work that needs a manager's attention, most urgent first
export function getTeamAlerts(tasks: Task[], today: Date = new Date()): TeamAlerts {
  const open = tasks.filter((task) => !task.parentId && task.status !== 'done');
  return {
    overdue: open.filter((task) => getDueState(task, today) === 'overdue').sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    blocked: open.filter((task) => task.isBlocked),
  };
}

// "Waiting 3d" style age for review queues
export function daysSince(iso: string, today: Date = new Date()): number {
  return Math.max(0, Math.floor((today.getTime() - new Date(iso).getTime()) / MS_PER_DAY));
}

/* ---------- Advanced filters (shareable in the URL) ---------- */

export type DueFilter = 'any' | 'overdue' | 'today' | 'next-7' | 'next-30';

export const DUE_FILTER_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'next-7', label: 'Due in the next 7 days' },
  { value: 'next-30', label: 'Due in the next 30 days' },
];

export interface AdvancedFilters {
  projectIds: string[];
  departments: string[];
  assigneeIds: string[];
  priorities: Task['priority'][];
  types: Task['type'][];
  due: DueFilter;
}

export const EMPTY_FILTERS: AdvancedFilters = { projectIds: [], departments: [], assigneeIds: [], priorities: [], types: [], due: 'any' };

// URL parameter for each list filter, e.g. ?priority=high,urgent&project=PRJ-IXP
const FILTER_PARAMS = { projectIds: 'project', departments: 'dept', assigneeIds: 'assignee', priorities: 'priority', types: 'type' } as const;

export function parseFilters(params: URLSearchParams): AdvancedFilters {
  const list = (name: string) => (params.get(name) ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  const due = params.get('due') as DueFilter | null;
  return {
    projectIds: list(FILTER_PARAMS.projectIds),
    departments: list(FILTER_PARAMS.departments),
    assigneeIds: list(FILTER_PARAMS.assigneeIds),
    priorities: list(FILTER_PARAMS.priorities) as Task['priority'][],
    types: list(FILTER_PARAMS.types) as Task['type'][],
    due: due && DUE_FILTER_OPTIONS.some((option) => option.value === due) ? due : 'any',
  };
}

// Changes to apply to the URL; empty filters remove their parameter
export function filtersToParams(filters: AdvancedFilters): Record<string, string | null> {
  const join = (values: string[]) => (values.length > 0 ? values.join(',') : null);
  return {
    [FILTER_PARAMS.projectIds]: join(filters.projectIds),
    [FILTER_PARAMS.departments]: join(filters.departments),
    [FILTER_PARAMS.assigneeIds]: join(filters.assigneeIds),
    [FILTER_PARAMS.priorities]: join(filters.priorities),
    [FILTER_PARAMS.types]: join(filters.types),
    due: filters.due === 'any' ? null : filters.due,
  };
}

export function countActiveFilters(filters: AdvancedFilters): number {
  return (
    filters.projectIds.length + filters.departments.length + filters.assigneeIds.length + filters.priorities.length + filters.types.length + (filters.due === 'any' ? 0 : 1)
  );
}

function matchesDue(task: Task, due: DueFilter, today: Date): boolean {
  if (due === 'any') return true;
  if (task.status === 'done') return false;
  const days = daysUntil(task.dueDate, today);
  switch (due) {
    case 'overdue':
      return days < 0;
    case 'today':
      return days === 0;
    case 'next-7':
      return days >= 0 && days <= 7;
    case 'next-30':
      return days >= 0 && days <= 30;
  }
}

// Within each filter any value matches; across filters all must match
export function matchesAdvancedFilters(task: Task, filters: AdvancedFilters, today: Date = new Date()): boolean {
  const department = getUserById(task.assigneeId)?.department ?? '';
  return (
    (filters.projectIds.length === 0 || filters.projectIds.includes(task.projectId)) &&
    (filters.departments.length === 0 || filters.departments.includes(department)) &&
    (filters.assigneeIds.length === 0 || filters.assigneeIds.includes(task.assigneeId)) &&
    (filters.priorities.length === 0 || filters.priorities.includes(task.priority)) &&
    (filters.types.length === 0 || filters.types.includes(task.type)) &&
    matchesDue(task, filters.due, today)
  );
}

// "Mobile App" -> "MA", "Payroll" -> "PAY": a starting point the admin can change
export function suggestProjectKey(name: string): string {
  const words = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const key = words.length === 1 ? words[0].slice(0, 3) : words.map((word) => word[0]).join('').slice(0, 5);
  return /^[A-Z]/.test(key) ? key : `P${key}`.slice(0, 10);
}
