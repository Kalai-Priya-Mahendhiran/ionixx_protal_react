import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Bug,
  CheckSquare,
  ChevronsUp,
  Equal,
  ListTree,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { TaskView } from '@/lib/permissions/task-permissions';
import type { TaskPriority, TaskStatus, TaskType } from '@/types';

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'To Do', className: 'bg-gray-100 text-gray-700' },
  'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  'in-review': { label: 'In Review', className: 'bg-indigo-100 text-indigo-800' },
  done: { label: 'Done', className: 'bg-green-100 text-green-800' },
  reopened: { label: 'Reopened', className: 'bg-amber-100 text-amber-800' },
};

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: LucideIcon; className: string }> = {
  task: { label: 'Task', icon: CheckSquare, className: 'bg-blue-500' },
  bug: { label: 'Bug', icon: Bug, className: 'bg-red-500' },
  story: { label: 'Story', icon: Bookmark, className: 'bg-green-500' },
  epic: { label: 'Epic', icon: Zap, className: 'bg-purple-500' },
  'sub-task': { label: 'Sub-task', icon: ListTree, className: 'bg-sky-500' },
  hr: { label: 'HR', icon: Users, className: 'bg-pink-500' },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: LucideIcon; className: string }> = {
  urgent: { label: 'Urgent', icon: ChevronsUp, className: 'text-red-600' },
  high: { label: 'High', icon: ArrowUp, className: 'text-orange-500' },
  medium: { label: 'Medium', icon: Equal, className: 'text-yellow-600' },
  low: { label: 'Low', icon: ArrowDown, className: 'text-green-600' },
};

// Board columns; Reopened work sits in To Do
export const BOARD_COLUMNS: { status: TaskStatus; label: string; dotClass: string }[] = [
  { status: 'todo', label: 'To Do', dotClass: 'bg-gray-400' },
  { status: 'in-progress', label: 'In Progress', dotClass: 'bg-blue-500' },
  { status: 'in-review', label: 'In Review', dotClass: 'bg-indigo-500' },
  { status: 'done', label: 'Done', dotClass: 'bg-green-500' },
];

export function getBoardColumn(status: TaskStatus): TaskStatus {
  return status === 'reopened' ? 'todo' : status;
}

const LABEL_COLORS = [
  'bg-sky-100 text-sky-800',
  'bg-pink-100 text-pink-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
  'bg-orange-100 text-orange-800',
];

// The same label always gets the same colour
export function getLabelColor(label: string): string {
  const hash = [...label].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}

export const TASK_VIEW_META: Record<TaskView, { title: string; description: string }> = {
  'my-tasks': { title: 'My Tasks', description: 'Tasks assigned to you or created by you' },
  'team-board': { title: 'Team Tasks', description: "Assign, track and unblock your team's work" },
  'hr-tasks': { title: 'HR Tasks', description: 'Onboarding, offboarding and other HR checklists' },
  'all-projects': { title: 'All Projects', description: 'Every task across projects and departments' },
  settings: { title: 'Tasks', description: 'All tasks across the organization' },
  'exec-dashboard': { title: 'Task Overview', description: 'Read-only view of progress across projects' },
};
