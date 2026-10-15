import type { UserRole } from '@/lib/mock-users';
import { USER_DIRECTORY, getTeamOf } from '@/lib/user-directory';
import type { Task, TaskStatus, TaskUser } from '@/types';

/*
 * Single source of truth for what each role may do in the Tasks module.
 * Components and the task service only ever call `can()` and the helpers below.
 * The backend must enforce the same matrix; hiding buttons is not a security boundary.
 */

export type TaskAction =
  | 'task.view'
  | 'task.create'
  | 'task.assign'
  | 'task.edit'
  | 'task.changeStatus'
  | 'task.delete'
  | 'task.approve'
  | 'workflow.configure'
  | 'reports.view';

// none: never · own: tasks assigned to (or reported by) the user · team: the user's direct reports
// hr: HR-type tasks · all: every task
export type PermissionScope = 'none' | 'own' | 'team' | 'hr' | 'all';

export const TASK_PERMISSION_MATRIX: Record<TaskAction, Record<UserRole, PermissionScope>> = {
  'task.view':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'all' },
  'task.create':        { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.assign':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.edit':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.changeStatus':  { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.delete':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.approve':       { employee: 'none', project_manager: 'team', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'workflow.configure': { employee: 'none', project_manager: 'none', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
  'reports.view':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'all' },
};

export interface PermissionUser {
  id: string;
  role: UserRole;
}

// The parts of a task a permission decision depends on (a full Task works too)
export type TaskScopeTarget = Pick<Task, 'assigneeId' | 'reporterId' | 'type'>;

// For these actions the task is judged by who it is (or will be) assigned to;
// for the rest, being the reporter also counts as "own"
const ASSIGNEE_ACTIONS = new Set<TaskAction>(['task.create', 'task.assign']);

export function getScope(user: PermissionUser | null | undefined, action: TaskAction): PermissionScope {
  return user ? TASK_PERMISSION_MATRIX[action][user.role] : 'none';
}

function getTeamIds(managerId: string): Set<string> {
  return new Set(getTeamOf(managerId).map((member) => member.id));
}

function isInScope(user: PermissionUser, scope: PermissionScope, action: TaskAction, task: TaskScopeTarget): boolean {
  const byAssignee = ASSIGNEE_ACTIONS.has(action);
  const involves = (ids: Set<string>) => ids.has(task.assigneeId) || (!byAssignee && ids.has(task.reporterId));

  if (involves(new Set([user.id]))) return true;
  switch (scope) {
    case 'all':
      return true;
    case 'team':
      return involves(getTeamIds(user.id));
    case 'hr':
      return task.type === 'hr';
    default:
      return false;
  }
}

/**
 * Can `user` perform `action`? Without a task, answers "for at least some tasks"
 * (e.g. whether to show the Create Task button). With a task, checks that task.
 */
export function can(user: PermissionUser | null | undefined, action: TaskAction, task?: TaskScopeTarget): boolean {
  const scope = getScope(user, action);
  if (!user || scope === 'none') return false;
  return task ? isInScope(user, scope, action, task) : true;
}

// Creating a task for someone else also needs task.assign for that person
export function canCreateTask(user: PermissionUser | null | undefined, draft: Pick<Task, 'assigneeId' | 'type'>): boolean {
  if (!user) return false;
  const target = { ...draft, reporterId: user.id };
  return can(user, 'task.create', target) && (draft.assigneeId === user.id || can(user, 'task.assign', target));
}

// Moving a task out of In Review to Done is an approval, so it needs task.approve as well
export function canTransition(user: PermissionUser | null | undefined, task: Task, to: TaskStatus): boolean {
  if (task.status === to || !can(user, 'task.changeStatus', task)) return false;
  if (task.status === 'in-review' && to === 'done') return can(user, 'task.approve', task);
  return true;
}

// Read-only users (e.g. Executive) see tasks but get no editing controls
export function isTaskReadOnly(user: PermissionUser | null | undefined): boolean {
  return !can(user, 'task.create') && !can(user, 'task.edit');
}

export function getVisibleTasks<T extends TaskScopeTarget>(user: PermissionUser | null | undefined, tasks: T[]): T[] {
  return tasks.filter((task) => can(user, 'task.view', task));
}

// People the user may pick in the Assignee field
export function getAssignableUsers(user: PermissionUser | null | undefined): TaskUser[] {
  if (!user) return [];
  switch (getScope(user, 'task.assign')) {
    case 'all':
    case 'hr':
      return USER_DIRECTORY;
    case 'team':
      return getTeamOf(user.id);
    default:
      return USER_DIRECTORY.filter((member) => member.id === user.id);
  }
}

/* ---------- Role-based default view ---------- */

export type TaskView = 'my-tasks' | 'team-board' | 'hr-tasks' | 'all-projects' | 'settings' | 'exec-dashboard';

export const DEFAULT_TASK_VIEW: Record<UserRole, TaskView> = {
  employee: 'my-tasks',
  project_manager: 'team-board',
  hr: 'hr-tasks',
  admin: 'all-projects',
  system_admin: 'settings',
  executive: 'exec-dashboard',
};

const TASK_VIEW_REQUIREMENTS: Record<TaskView, (user: PermissionUser) => boolean> = {
  'my-tasks': () => true,
  'team-board': (user) => ['team', 'all'].includes(getScope(user, 'task.view')),
  'hr-tasks': (user) => ['hr', 'all'].includes(getScope(user, 'task.view')),
  'all-projects': (user) => getScope(user, 'task.view') === 'all',
  settings: (user) => can(user, 'workflow.configure'),
  'exec-dashboard': (user) => getScope(user, 'reports.view') === 'all',
};

export function canOpenTaskView(user: PermissionUser | null | undefined, view: string): view is TaskView {
  return !!user && view in TASK_VIEW_REQUIREMENTS && TASK_VIEW_REQUIREMENTS[view as TaskView](user);
}

// The requested view if the user may open it, otherwise their role's default
export function resolveTaskView(user: PermissionUser, requested: string | null): TaskView {
  return requested && canOpenTaskView(user, requested) ? requested : DEFAULT_TASK_VIEW[user.role];
}
