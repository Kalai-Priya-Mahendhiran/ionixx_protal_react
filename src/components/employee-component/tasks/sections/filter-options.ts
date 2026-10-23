import { TASK_ISSUE_TYPES, TASK_PRIORITIES } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import type { Project, Sprint, Task } from '@/types';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from './task-config';
import { BACKLOG_FILTER } from './task-utils';

const SPRINT_ORDER: Record<Sprint['status'], number> = { active: 0, planned: 1, completed: 2 };

export type FilterListKey = 'projectIds' | 'sprintIds' | 'departments' | 'assigneeIds' | 'priorities' | 'types';

export interface FilterOption {
  value: string;
  label: string;
  // e.g. a sprint's status
  hint?: string;
}

// Options come from the tasks the user can already see, so filters never reveal anything new
export function getFilterOptions(tasks: Task[], projects: Project[], sprints: Sprint[] = []): Record<FilterListKey, FilterOption[]> {
  const unique = (values: string[]) => [...new Set(values)].filter(Boolean);
  const assigneeIds = unique(tasks.map((task) => task.assigneeId));
  return {
    projectIds: projects
      .filter((project) => tasks.some((task) => task.projectId === project.id))
      .map((project) => ({ value: project.id, label: `${project.name} (${project.key})` })),
    // Running and upcoming sprints of the projects on screen, then finished ones that still hold visible work
    sprintIds: [
      ...[...sprints]
        .filter((sprint) => sprint.status !== 'completed' || tasks.some((task) => task.sprintId === sprint.id))
        .filter((sprint) => tasks.some((task) => task.projectId === sprint.projectId))
        .sort((a, b) => SPRINT_ORDER[a.status] - SPRINT_ORDER[b.status] || b.startDate.localeCompare(a.startDate))
        .map((sprint) => ({ value: sprint.id, label: sprint.name, hint: sprint.status })),
      { value: BACKLOG_FILTER, label: 'Backlog (no sprint)' },
    ],
    departments: unique(assigneeIds.map((id) => getUserById(id)?.department ?? ''))
      .sort()
      .map((department) => ({ value: department, label: department })),
    assigneeIds: assigneeIds
      .map((id) => ({ value: id, label: getUserById(id)?.name ?? 'Unknown user' }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    priorities: [...TASK_PRIORITIES].reverse().map((value) => ({ value, label: TASK_PRIORITY_CONFIG[value].label })),
    types: TASK_ISSUE_TYPES.filter((type) => tasks.some((task) => task.type === type)).map((value) => ({ value, label: TASK_TYPE_CONFIG[value].label })),
  };
}
