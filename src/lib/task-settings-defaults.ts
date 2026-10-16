import type { LabelColor, PermissionMatrix, TaskSettings, WorkflowSettings } from '@/types';

/*
 * Out-of-the-box Tasks settings. System Admins change them in Settings; "Reset to defaults" restores these.
 * With the backend these come from GET /api/task-settings.
 */

export const DEFAULT_PERMISSION_MATRIX: PermissionMatrix = {
  // Admin is office operations: no project tasks (the service desk rows below are theirs)
  'task.view':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'all' },
  'task.create':        { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.assign':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.edit':          { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.changeStatus':  { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.delete':        { employee: 'none', project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.approve':       { employee: 'none', project_manager: 'team', hr: 'none', admin: 'none', system_admin: 'none', executive: 'none' },
  'task.comment':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.logWork':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'none' },
  'task.watch':         { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'all' },
  'sprint.manage':      { employee: 'none', project_manager: 'team', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
  'template.manage':    { employee: 'none', project_manager: 'none', hr: 'all',  admin: 'none', system_admin: 'all',  executive: 'none' },
  'project.manage':     { employee: 'none', project_manager: 'none', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
  'workflow.configure': { employee: 'none', project_manager: 'none', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
  'reports.view':       { employee: 'own',  project_manager: 'team', hr: 'hr',   admin: 'none', system_admin: 'all',  executive: 'all' },
  // Service desk: everyone raises and follows their own requests; HR also raises them for new joiners and leavers.
  // The Admin team works the queue, the asset log and office expenses.
  'request.create':     { employee: 'own',  project_manager: 'own',  hr: 'all',  admin: 'all',  system_admin: 'own',  executive: 'own' },
  'request.view':       { employee: 'own',  project_manager: 'own',  hr: 'own',  admin: 'all',  system_admin: 'own',  executive: 'own' },
  'request.comment':    { employee: 'own',  project_manager: 'own',  hr: 'own',  admin: 'all',  system_admin: 'own',  executive: 'own' },
  'request.manage':     { employee: 'none', project_manager: 'none', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'asset.manage':       { employee: 'none', project_manager: 'none', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'expense.manage':     { employee: 'none', project_manager: 'none', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'desk.configure':     { employee: 'none', project_manager: 'none', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  'desk.reports':       { employee: 'none', project_manager: 'none', hr: 'none', admin: 'all',  system_admin: 'none', executive: 'none' },
  // Accounts, roles and page/project access stay with System Admin
  'user.manage':        { employee: 'none', project_manager: 'none', hr: 'none', admin: 'none', system_admin: 'all',  executive: 'none' },
};

export const DEFAULT_WORKFLOW: WorkflowSettings = {
  statuses: [
    { id: 'todo', label: 'To Do', color: 'gray', category: 'todo', enabled: true, system: true },
    { id: 'in-progress', label: 'In Progress', color: 'blue', category: 'active', enabled: true, system: true },
    { id: 'in-review', label: 'In Review', color: 'indigo', category: 'review', enabled: true, system: true },
    { id: 'done', label: 'Done', color: 'green', category: 'done', enabled: true, system: true },
    // Reopened work waits in the To Do column
    { id: 'reopened', label: 'Reopened', color: 'amber', category: 'todo', enabled: true, system: true, boardColumn: 'todo' },
  ],
  // Work moves freely until it's Done; finished work can only be reopened
  transitions: {
    todo: ['in-progress', 'in-review', 'done'],
    'in-progress': ['todo', 'in-review', 'done'],
    'in-review': ['in-progress', 'done', 'todo'],
    done: ['reopened'],
    reopened: ['in-progress', 'in-review', 'done', 'todo'],
  },
};

const LABEL_COLORS: LabelColor[] = ['sky', 'pink', 'emerald', 'amber', 'violet', 'rose', 'teal', 'orange'];

// The same colour a label had before labels were configurable
export function defaultLabelColor(label: string): LabelColor {
  const hash = [...label].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return LABEL_COLORS[hash % LABEL_COLORS.length];
}

const DEFAULT_LABELS = [
  'api', 'auth', 'compliance', 'design', 'devops', 'docs', 'leave-tracker', 'learning', 'mobile',
  'offboarding', 'onboarding', 'organization', 'performance', 'qa', 'reports', 'review', 'roadmap',
];

export function createDefaultTaskSettings(): TaskSettings {
  return {
    workflow: cloneSettings(DEFAULT_WORKFLOW),
    issueTypes: [
      { type: 'task', label: 'Task', enabled: true },
      { type: 'bug', label: 'Bug', enabled: true },
      { type: 'story', label: 'Story', enabled: true },
      { type: 'epic', label: 'Epic', enabled: true },
      { type: 'sub-task', label: 'Sub-task', enabled: true },
      { type: 'hr', label: 'HR', enabled: true },
    ],
    priorities: [
      { priority: 'low', label: 'Low' },
      { priority: 'medium', label: 'Medium' },
      { priority: 'high', label: 'High' },
      { priority: 'urgent', label: 'Urgent' },
    ],
    labels: DEFAULT_LABELS.map((name) => ({ name, color: defaultLabelColor(name) })),
    permissions: cloneSettings(DEFAULT_PERMISSION_MATRIX),
    updatedAt: new Date(0).toISOString(),
    updatedById: 'system',
  };
}

// JSON round trip: settings are plain data (also works in test environments without structuredClone)
export function cloneSettings<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
