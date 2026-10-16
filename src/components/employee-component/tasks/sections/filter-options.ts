import { TASK_ISSUE_TYPES, TASK_PRIORITIES } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import type { Project, Task } from '@/types';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from './task-config';

export type FilterListKey = 'projectIds' | 'departments' | 'assigneeIds' | 'priorities' | 'types';

export interface FilterOption {
  value: string;
  label: string;
}

// Options come from the tasks the user can already see, so filters never reveal anything new
export function getFilterOptions(tasks: Task[], projects: Project[]): Record<FilterListKey, FilterOption[]> {
  const unique = (values: string[]) => [...new Set(values)].filter(Boolean);
  const assigneeIds = unique(tasks.map((task) => task.assigneeId));
  return {
    projectIds: projects
      .filter((project) => tasks.some((task) => task.projectId === project.id))
      .map((project) => ({ value: project.id, label: `${project.name} (${project.key})` })),
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
