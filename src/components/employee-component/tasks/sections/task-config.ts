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
import { getPriorityLabel, getTypeLabel } from '@/lib/workflow';
import type { TaskPriority, TaskType } from '@/types';

// Statuses, board columns and label colours come from the configured workflow (Settings)
export { getBoardColumn, getBoardColumns, getLabelColor, getStatusMeta } from '@/lib/workflow';

interface IconConfig {
  readonly label: string;
  icon: LucideIcon;
  className: string;
}

// Icons and colours are fixed; names follow Settings → Types & Labels
const withLabel = (getLabel: () => string, icon: LucideIcon, className: string): IconConfig => ({
  get label() {
    return getLabel();
  },
  icon,
  className,
});

export const TASK_TYPE_CONFIG: Record<TaskType, IconConfig> = {
  task: withLabel(() => getTypeLabel('task'), CheckSquare, 'bg-blue-500'),
  bug: withLabel(() => getTypeLabel('bug'), Bug, 'bg-red-500'),
  story: withLabel(() => getTypeLabel('story'), Bookmark, 'bg-green-500'),
  epic: withLabel(() => getTypeLabel('epic'), Zap, 'bg-purple-500'),
  'sub-task': withLabel(() => getTypeLabel('sub-task'), ListTree, 'bg-sky-500'),
  hr: withLabel(() => getTypeLabel('hr'), Users, 'bg-pink-500'),
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, IconConfig> = {
  urgent: withLabel(() => getPriorityLabel('urgent'), ChevronsUp, 'text-red-600'),
  high: withLabel(() => getPriorityLabel('high'), ArrowUp, 'text-orange-500'),
  medium: withLabel(() => getPriorityLabel('medium'), Equal, 'text-yellow-600'),
  low: withLabel(() => getPriorityLabel('low'), ArrowDown, 'text-green-600'),
};

export const TASK_VIEW_META: Record<TaskView, { title: string; description: string }> = {
  'my-tasks': { title: 'My Tasks', description: 'Tasks assigned to you or created by you' },
  'team-board': { title: 'Team Tasks', description: "Assign, track and unblock your team's work" },
  'hr-tasks': { title: 'HR Tasks', description: 'Onboarding, offboarding and other HR checklists' },
  'all-projects': { title: 'All Projects', description: 'Every task across projects and departments' },
  settings: { title: 'Task Settings', description: 'Workflow, fields, permissions, automation and the audit log' },
  'exec-dashboard': { title: 'Task Overview', description: 'Read-only view of progress across projects' },
};
