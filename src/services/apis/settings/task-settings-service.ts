import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { DEFAULT_PERMISSION_MATRIX, DEFAULT_WORKFLOW, cloneSettings, createDefaultTaskSettings } from '@/lib/task-settings-defaults';
import { getTaskSettings, replaceTaskSettings } from '@/lib/task-settings-store';
import { LOCKED_STATUSES } from '@/lib/workflow';
import type { IssueTypeSetting, LabelSetting, PermissionMatrix, PrioritySetting, TaskSettings, WorkflowSettings } from '@/types';
import { auditService } from '../audit/audit-service';

/*
 * Tasks settings: workflow, task types, priorities, labels and the permission matrix.
 * Only System Admins (workflow.configure) change them. In-memory mock (resets on refresh);
 * endpoints: GET /api/task-settings, PUT /api/task-settings/{workflow|fields|labels|permissions}.
 * The backend must apply the same validation, and enforce the saved matrix and workflow on every request.
 */

const MOCK_LATENCY_MS = 200;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

function assertCanConfigure(actor: PermissionUser) {
  if (!can(actor, 'workflow.configure')) throw new Error("You don't have permission to change task settings");
}

function save(actor: PermissionUser, changes: Partial<TaskSettings>, summary: string): TaskSettings {
  const next: TaskSettings = { ...getTaskSettings(), ...cloneSettings(changes), updatedAt: new Date().toISOString(), updatedById: actor.id };
  replaceTaskSettings(next);
  auditService.record({ actorId: actor.id, entity: 'settings', entityKey: 'Task settings', action: 'updated', summary });
  return next;
}

// Rules that keep the rest of the module working whatever the admin configures
export function validateWorkflow(workflow: WorkflowSettings): void {
  const ids = workflow.statuses.map((status) => status.id);
  if (new Set(ids).size !== ids.length) throw new Error('Each status needs its own ID');
  const labels = workflow.statuses.map((status) => status.label.trim().toLowerCase());
  if (labels.some((label) => !label)) throw new Error('Every status needs a name');
  if (new Set(labels).size !== labels.length) throw new Error('Two statuses have the same name');
  LOCKED_STATUSES.forEach((id) => {
    const status = workflow.statuses.find((item) => item.id === id);
    if (!status?.enabled) throw new Error(`"${status?.label ?? id}" can't be turned off: new tasks start in To Do and Done marks work finished`);
  });
  workflow.statuses.forEach((status) => {
    if (!status.system && (status.category === 'review' || status.category === 'done')) {
      throw new Error(`"${status.label}": custom statuses are "to do" or "in progress" kinds; approval and Done are built in`);
    }
    if (status.boardColumn) {
      const column = workflow.statuses.find((item) => item.id === status.boardColumn);
      if (!column || column.boardColumn || column.id === status.id) throw new Error(`"${status.label}" must be shown in a status that has its own column`);
    }
  });
  Object.entries(workflow.transitions).forEach(([from, targets]) => {
    if (!ids.includes(from) || targets.some((to) => !ids.includes(to) || to === from)) throw new Error('A transition points at a status that no longer exists');
  });
  const enabled = workflow.statuses.filter((status) => status.enabled);
  // Every status in use must be reachable and leave a way out, or tasks get stuck
  enabled.forEach((status) => {
    const outgoing = (workflow.transitions[status.id] ?? []).filter((to) => enabled.some((item) => item.id === to));
    if (outgoing.length === 0) throw new Error(`"${status.label}" has no allowed next status, so tasks would get stuck there`);
    const incoming = status.id === 'todo' || enabled.some((from) => (workflow.transitions[from.id] ?? []).includes(status.id));
    if (!incoming) throw new Error(`No status can move to "${status.label}", so it could never be used`);
  });
}

export const taskSettingsService = {
  // GET /api/task-settings
  async get(): Promise<TaskSettings> {
    await delay();
    return getTaskSettings();
  },

  // PUT /api/task-settings/workflow
  async saveWorkflow(actor: PermissionUser, workflow: WorkflowSettings): Promise<TaskSettings> {
    await delay();
    assertCanConfigure(actor);
    const cleaned: WorkflowSettings = {
      statuses: workflow.statuses.map((status) => ({ ...status, label: status.label.trim() })),
      transitions: workflow.transitions,
    };
    validateWorkflow(cleaned);
    return save(actor, { workflow: cleaned }, `Workflow saved: ${cleaned.statuses.filter((status) => status.enabled).map((status) => status.label).join(' → ')}`);
  },

  // PUT /api/task-settings/fields
  async saveFields(actor: PermissionUser, fields: { issueTypes: IssueTypeSetting[]; priorities: PrioritySetting[] }): Promise<TaskSettings> {
    await delay();
    assertCanConfigure(actor);
    if ([...fields.issueTypes, ...fields.priorities].some((item) => !item.label.trim())) throw new Error('Every type and priority needs a name');
    if (!fields.issueTypes.some((item) => item.enabled && item.type !== 'sub-task')) throw new Error('Keep at least one task type turned on');
    return save(
      actor,
      {
        issueTypes: fields.issueTypes.map((item) => ({ ...item, label: item.label.trim() })),
        priorities: fields.priorities.map((item) => ({ ...item, label: item.label.trim() })),
      },
      `Task types and priorities saved (${fields.issueTypes.filter((item) => item.enabled).length} types on)`,
    );
  },

  // PUT /api/task-settings/labels — renames and deletes across tasks happen in taskService
  async saveLabels(actor: PermissionUser, labels: LabelSetting[]): Promise<TaskSettings> {
    await delay();
    assertCanConfigure(actor);
    const names = labels.map((label) => label.name.trim().toLowerCase());
    if (names.some((name) => !/^[a-z0-9][a-z0-9-]{0,29}$/.test(name))) throw new Error('Labels are 1–30 lowercase letters, digits or dashes, e.g. leave-tracker');
    if (new Set(names).size !== names.length) throw new Error('Two labels have the same name');
    return save(actor, { labels: labels.map((label) => ({ ...label, name: label.name.trim().toLowerCase() })) }, `Labels saved (${labels.length})`);
  },

  // PUT /api/task-settings/permissions
  async savePermissions(actor: PermissionUser, permissions: PermissionMatrix): Promise<TaskSettings> {
    await delay();
    assertCanConfigure(actor);
    // Never let System Admins lock themselves (and everyone) out of Settings
    if (permissions['workflow.configure']?.system_admin !== 'all') throw new Error('System Admin must keep access to Settings');
    if (permissions['user.manage']?.system_admin !== 'all') throw new Error('System Admin must keep access to User Management');
    const changed = Object.entries(permissions).flatMap(([action, roles]) =>
      Object.entries(roles)
        .filter(([role, scope]) => getTaskSettings().permissions[action as keyof PermissionMatrix]?.[role as keyof PermissionMatrix['task.view']] !== scope)
        .map(([role, scope]) => `${action} · ${role} → ${scope}`),
    );
    return save(actor, { permissions }, changed.length > 0 ? `Permissions changed: ${changed.join('; ')}` : 'Permissions saved (no changes)');
  },

  // POST /api/task-settings/reset { part }
  async reset(actor: PermissionUser, part: 'workflow' | 'fields' | 'labels' | 'permissions'): Promise<TaskSettings> {
    await delay();
    assertCanConfigure(actor);
    const defaults = createDefaultTaskSettings();
    const changes: Partial<TaskSettings> =
      part === 'workflow'
        ? { workflow: cloneSettings(DEFAULT_WORKFLOW) }
        : part === 'permissions'
          ? { permissions: cloneSettings(DEFAULT_PERMISSION_MATRIX) }
          : part === 'labels'
            ? { labels: defaults.labels }
            : { issueTypes: defaults.issueTypes, priorities: defaults.priorities };
    return save(actor, changes, `${part.charAt(0).toUpperCase() + part.slice(1)} reset to defaults`);
  },
};
