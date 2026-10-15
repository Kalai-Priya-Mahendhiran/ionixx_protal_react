import type { UserRole } from '@/lib/mock-users';
import { USER_DIRECTORY, getTeamOf } from '@/lib/user-directory';
import type { Project, Task, TaskStatus, TaskUser } from '@/types';

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
  | 'task.comment'
  | 'task.logWork'
  | 'task.watch'
  | 'sprint.manage'
  | 'template.manage'
  | 'workflow.configure'
  | 'reports.view';

// none: never · own: tasks assigned to (or reported by) the user · team: the user's direct reports
// hr: HR-type tasks only (not project work, even the user's own) · all: every task
export type PermissionScope = 'none' | 'own' | 'team' | 'hr' | 'all';

export const TASK_PERMISSION_MATRIX: Record<TaskAction, Record<UserRole, PermissionScope>> = {
  'task.view':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'all' },
  'task.create':        { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.assign':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.edit':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.changeStatus':  { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.delete':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.approve':       { employee: 'none', project_manager: 'team', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'task.comment':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.logWork':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'none' },
  'task.watch':         { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'all' },
  'sprint.manage':      { employee: 'none', project_manager: 'team', hr: 'none', admin: 'all',  system_admin: 'all',  executive: 'none' },
  'template.manage':    { employee: 'none', project_manager: 'none', hr: 'all',  admin: 'all',  system_admin: 'all',  executive: 'none' },
  'workflow.configure': { employee: 'none', project_manager: 'none', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
  'reports.view':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'all',  system_admin: 'all',  executive: 'all' },
};

export interface PermissionUser {
  id: string;
  role: UserRole;
}

// The parts of a task a permission decision depends on (a full Task works too)
export type TaskScopeTarget = Pick<Task, 'assigneeId' | 'reporterId' | 'type'> & Partial<Pick<Task, 'watcherIds'>>;

// For these actions the task is judged by who it is (or will be) assigned to;
// for the rest, being the reporter also counts as "own"
const ASSIGNEE_ACTIONS = new Set<TaskAction>(['task.create', 'task.assign']);

// Watchers can follow the conversation on a task: see it, keep watching and comment
const WATCHER_ACTIONS = new Set<TaskAction>(['task.view', 'task.watch', 'task.comment']);

export function getScope(user: PermissionUser | null | undefined, action: TaskAction): PermissionScope {
  return user ? TASK_PERMISSION_MATRIX[action][user.role] : 'none';
}

function getTeamIds(managerId: string): Set<string> {
  return new Set(getTeamOf(managerId).map((member) => member.id));
}

function isInScope(user: PermissionUser, scope: PermissionScope, action: TaskAction, task: TaskScopeTarget): boolean {
  // HR works on HR-type tasks only, never project work, even when they're involved in it
  if (scope === 'hr') return task.type === 'hr';

  const byAssignee = ASSIGNEE_ACTIONS.has(action);
  const involves = (ids: Set<string>) => ids.has(task.assigneeId) || (!byAssignee && ids.has(task.reporterId));

  if (involves(new Set([user.id]))) return true;
  if (WATCHER_ACTIONS.has(action) && task.watcherIds?.includes(user.id)) return true;
  switch (scope) {
    case 'all':
      return true;
    case 'team':
      return involves(getTeamIds(user.id));
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

// Sub-tasks are visible to anyone who can see their parent, so a checklist is never half hidden
export function getVisibleTasks<T extends TaskScopeTarget & Pick<Task, 'id' | 'parentId'>>(
  user: PermissionUser | null | undefined,
  tasks: T[],
): T[] {
  const visibleIds = new Set(tasks.filter((task) => can(user, 'task.view', task)).map((task) => task.id));
  return tasks.filter((task) => visibleIds.has(task.id) || (!!task.parentId && visibleIds.has(task.parentId)));
}

// A sub-task of an HR task is itself HR work; anything else is a plain sub-task
export function getSubtaskType(parent: Pick<Task, 'type'>): Task['type'] {
  return parent.type === 'hr' ? 'hr' : 'sub-task';
}

// Sub-tasks can be added to a task you can edit, assigned to someone you could create a task for
export function canCreateSubtask(user: PermissionUser | null | undefined, parent: Task, assigneeId: string): boolean {
  return can(user, 'task.edit', parent) && canCreateTask(user, { assigneeId, type: getSubtaskType(parent) });
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

/* ---------- Manager tools (Phase 3) ---------- */

// Sprints belong to a project: managers plan the projects they lead or work in, admins plan all
export function canManageSprints(user: PermissionUser | null | undefined, project: Pick<Project, 'leadId' | 'memberIds'>): boolean {
  switch (getScope(user, 'sprint.manage')) {
    case 'all':
      return true;
    case 'team':
      return !!user && (project.leadId === user.id || project.memberIds.includes(user.id));
    default:
      return false;
  }
}

// Reviewing your own work doesn't count as an approval
export function canApprove(user: PermissionUser | null | undefined, task: Task): boolean {
  return !!user && task.status === 'in-review' && task.assigneeId !== user.id && can(user, 'task.approve', task);
}

// Moving a card to someone else's swimlane: edit the task and assign it to that person
export function canReassign(user: PermissionUser | null | undefined, task: Task, assigneeId: string): boolean {
  return task.assigneeId !== assigneeId && can(user, 'task.edit', task) && can(user, 'task.assign', { ...task, assigneeId });
}

export type ManagerSection = 'board' | 'workload' | 'sprints' | 'approvals';

const MANAGER_SECTION_REQUIREMENTS: Record<ManagerSection, (user: PermissionUser) => boolean> = {
  board: () => true,
  workload: (user) => ['team', 'all'].includes(getScope(user, 'task.view')) && can(user, 'task.assign'),
  sprints: (user) => can(user, 'sprint.manage'),
  approvals: (user) => can(user, 'task.approve'),
};

// Sections shown as tabs on the Tasks page; just ['board'] means no tabs
export function getManagerSections(user: PermissionUser | null | undefined): ManagerSection[] {
  if (!user) return ['board'];
  return (Object.keys(MANAGER_SECTION_REQUIREMENTS) as ManagerSection[]).filter((section) => MANAGER_SECTION_REQUIREMENTS[section](user));
}

/* ---------- Page sections per view ---------- */

export type TaskSection = ManagerSection | 'checklists' | 'templates';

const HR_SECTION_REQUIREMENTS: Record<'board' | 'checklists' | 'templates', (user: PermissionUser) => boolean> = {
  board: () => true,
  checklists: (user) => can(user, 'template.manage'),
  templates: (user) => can(user, 'template.manage'),
};

// Tabs on the Tasks page: HR tools on the HR view, manager tools on team-wide views, none on My Tasks.
// A single 'board' entry means no tabs are shown.
export function getSectionsForView(user: PermissionUser | null | undefined, view: TaskView): TaskSection[] {
  if (!user || view === 'my-tasks') return ['board'];
  if (view === 'hr-tasks') {
    return (Object.keys(HR_SECTION_REQUIREMENTS) as (keyof typeof HR_SECTION_REQUIREMENTS)[]).filter((section) =>
      HR_SECTION_REQUIREMENTS[section](user),
    );
  }
  return getManagerSections(user);
}
