import type { UserRole } from '@/lib/mock-users';
import { USER_DIRECTORY, getTeamOf } from '@/lib/user-directory';
import { getTaskSettings } from '@/lib/task-settings-store';
import { isTransitionAllowed } from '@/lib/workflow';
import type { PermissionScope, Project, Task, TaskAction, TaskStatus, TaskUser } from '@/types';

export type { PermissionScope, TaskAction } from '@/types';
export { DEFAULT_PERMISSION_MATRIX as TASK_PERMISSION_MATRIX } from '@/lib/task-settings-defaults';

/*
 * Single source of truth for what each role may do in the Tasks module.
 * The matrix itself is data (Settings → Permissions); the rules for applying it live here.
 * Components and the task service only ever call `can()` and the helpers below.
 * The backend must enforce the same matrix; hiding buttons is not a security boundary.
 */

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
  return user ? (getTaskSettings().permissions[action]?.[user.role] ?? 'none') : 'none';
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
// The configured workflow decides which moves exist; permissions decide who may make them
export function canTransition(user: PermissionUser | null | undefined, task: Task, to: TaskStatus): boolean {
  if (!isTransitionAllowed(task.status, to) || !can(user, 'task.changeStatus', task)) return false;
  if (task.status === 'in-review' && to === 'done') return can(user, 'task.approve', task);
  return true;
}

// The first status in the list the user may move the task to, e.g. for a board column holding To Do and Reopened
export function firstAllowedStatus(user: PermissionUser | null | undefined, task: Task, statuses: TaskStatus[]): TaskStatus | undefined {
  return statuses.find((status) => canTransition(user, task, status));
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

export type ManagerSection = 'board' | 'workload' | 'sprints' | 'approvals' | 'projects';

const MANAGER_SECTION_REQUIREMENTS: Record<ManagerSection, (user: PermissionUser) => boolean> = {
  board: () => true,
  workload: (user) => ['team', 'all'].includes(getScope(user, 'task.view')) && can(user, 'task.assign'),
  sprints: (user) => can(user, 'sprint.manage'),
  approvals: (user) => can(user, 'task.approve'),
  projects: (user) => can(user, 'project.manage'),
};

// Sections shown as tabs on the Tasks page; just ['board'] means no tabs
export function getManagerSections(user: PermissionUser | null | undefined): ManagerSection[] {
  if (!user) return ['board'];
  return (Object.keys(MANAGER_SECTION_REQUIREMENTS) as ManagerSection[]).filter((section) => MANAGER_SECTION_REQUIREMENTS[section](user));
}

/* ---------- Page sections per view ---------- */

export type SettingsSection = 'workflow' | 'fields' | 'permissions' | 'automation' | 'audit';

export type TaskSection = ManagerSection | 'checklists' | 'templates' | SettingsSection;

const SETTINGS_SECTIONS: SettingsSection[] = ['workflow', 'fields', 'permissions', 'automation', 'audit'];

const HR_SECTION_REQUIREMENTS: Record<'board' | 'checklists' | 'templates', (user: PermissionUser) => boolean> = {
  board: () => true,
  checklists: (user) => can(user, 'template.manage'),
  templates: (user) => can(user, 'template.manage'),
};

// Tabs on the Tasks page: settings on the Settings view, HR tools on the HR view, manager tools on team-wide views, none on My Tasks.
// A single 'board' entry means no tabs are shown.
export function getSectionsForView(user: PermissionUser | null | undefined, view: TaskView): TaskSection[] {
  // My Tasks and the read-only overview have no tool tabs
  if (!user || view === 'my-tasks' || view === 'exec-dashboard') return ['board'];
  // The Settings view is only tools; people without access fall back to the default view before this
  if (view === 'settings') return can(user, 'workflow.configure') ? SETTINGS_SECTIONS : ['board'];
  if (view === 'hr-tasks') {
    return (Object.keys(HR_SECTION_REQUIREMENTS) as (keyof typeof HR_SECTION_REQUIREMENTS)[]).filter((section) =>
      HR_SECTION_REQUIREMENTS[section](user),
    );
  }
  return getManagerSections(user);
}

/* ---------- Admin tools (Phase 5) ---------- */

// Creating projects and managing their members
export function canManageProjects(user: PermissionUser | null | undefined): boolean {
  return can(user, 'project.manage');
}

// Moving a task changes its key, so it needs both edit rights on the task and project management rights
export function canMoveToProject(user: PermissionUser | null | undefined, task: Task, projectId: string): boolean {
  return task.projectId !== projectId && !task.parentId && can(user, 'task.edit', task) && canManageProjects(user);
}
