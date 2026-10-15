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
export function filterTasksForView(view: TaskView, tasks: Task[], userId: string): Task[] {
  switch (view) {
    case 'my-tasks':
      return tasks.filter((task) => task.assigneeId === userId || task.reporterId === userId);
    case 'hr-tasks':
      return tasks.filter((task) => task.type === 'hr');
    default:
      return tasks;
  }
}

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
