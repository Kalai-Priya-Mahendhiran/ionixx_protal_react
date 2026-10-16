import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { generateId } from '@/lib/utils';
import type { AutomationAction, AutomationCondition, AutomationRule, AutomationTrigger, Task, TaskStatus } from '@/types';
import { auditService } from '../audit/audit-service';

/*
 * "When / If / Then" rules. This service stores rules and decides which ones match an event;
 * taskService applies their actions (it owns the tasks). In-memory mock (resets on refresh);
 * endpoints: GET/POST /api/automation-rules, PUT/DELETE /api/automation-rules/:id.
 * With the backend, rules run server-side, including a scheduled job for "due date passed".
 */

export type AutomationRuleInput = Pick<AutomationRule, 'name' | 'enabled' | 'trigger' | 'triggerStatus' | 'conditions' | 'actions'>;

const MOCK_LATENCY_MS = 150;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const seededAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

let rules: AutomationRule[] = [
  {
    id: 'RULE-OVERDUE',
    name: 'Overdue work → tell the manager',
    enabled: true,
    trigger: 'due-date-passed',
    conditions: [{ field: 'status', operator: 'is-not', value: 'done' }],
    actions: [{ kind: 'notify', recipient: 'manager' }],
    runCount: 0,
    updatedById: 'SYS001',
    updatedAt: seededAt,
  },
  {
    id: 'RULE-REOPENED',
    name: 'Reopened work → raise priority',
    enabled: true,
    trigger: 'status-changed',
    triggerStatus: 'reopened',
    conditions: [],
    actions: [
      { kind: 'set-priority', priority: 'high' },
      { kind: 'notify', recipient: 'assignee' },
    ],
    runCount: 0,
    updatedById: 'SYS001',
    updatedAt: seededAt,
  },
];

// "Due date passed" fires once per rule, task and due date (moving the date re-arms it)
const firedOnce = new Set<string>();

function assertCanConfigure(actor: PermissionUser) {
  if (!can(actor, 'workflow.configure')) throw new Error("You don't have permission to manage automation");
}

export function validateRule(input: AutomationRuleInput): void {
  if (!input.name.trim()) throw new Error('Give the rule a name');
  if (input.actions.length === 0) throw new Error('Add at least one "Then" action');
  input.conditions.forEach((condition) => {
    if (!condition.value) throw new Error('Every "If" condition needs a value');
  });
  input.actions.forEach((action) => {
    if (action.kind === 'add-label' && !action.label.trim()) throw new Error('Choose the label to add');
  });
}

function conditionHolds(condition: AutomationCondition, task: Task): boolean {
  const actual = { status: task.status, priority: task.priority, type: task.type, project: task.projectId }[condition.field];
  return condition.operator === 'is' ? actual === condition.value : actual !== condition.value;
}

export function ruleMatches(rule: AutomationRule, trigger: AutomationTrigger, task: Task, toStatus?: TaskStatus): boolean {
  if (!rule.enabled || rule.trigger !== trigger) return false;
  if (trigger === 'status-changed' && rule.triggerStatus && rule.triggerStatus !== toStatus) return false;
  return rule.conditions.every((condition) => conditionHolds(condition, task));
}

const normalize = (input: AutomationRuleInput): AutomationRuleInput => ({
  ...input,
  name: input.name.trim(),
  triggerStatus: input.trigger === 'status-changed' ? input.triggerStatus || undefined : undefined,
  actions: input.actions.map((action): AutomationAction => (action.kind === 'add-label' ? { ...action, label: action.label.trim().toLowerCase() } : action)),
});

export const automationService = {
  // GET /api/automation-rules
  async list(actor: PermissionUser): Promise<AutomationRule[]> {
    await delay();
    assertCanConfigure(actor);
    return rules;
  },

  // POST /api/automation-rules
  async create(actor: PermissionUser, input: AutomationRuleInput): Promise<AutomationRule> {
    await delay();
    assertCanConfigure(actor);
    validateRule(input);
    const rule: AutomationRule = { ...normalize(input), id: generateId(), runCount: 0, updatedById: actor.id, updatedAt: new Date().toISOString() };
    rules = [...rules, rule];
    auditService.record({ actorId: actor.id, entity: 'automation', entityKey: rule.name, action: 'created', summary: 'Rule created' });
    return rule;
  },

  // PUT /api/automation-rules/:id
  async update(actor: PermissionUser, id: string, input: AutomationRuleInput): Promise<AutomationRule> {
    await delay();
    assertCanConfigure(actor);
    validateRule(input);
    const existing = rules.find((rule) => rule.id === id);
    if (!existing) throw new Error('Rule not found');
    const updated: AutomationRule = { ...existing, ...normalize(input), updatedById: actor.id, updatedAt: new Date().toISOString() };
    rules = rules.map((rule) => (rule.id === id ? updated : rule));
    const summary = existing.enabled !== updated.enabled ? (updated.enabled ? 'Rule turned on' : 'Rule turned off') : 'Rule updated';
    auditService.record({ actorId: actor.id, entity: 'automation', entityKey: updated.name, action: 'updated', summary });
    return updated;
  },

  // DELETE /api/automation-rules/:id
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    assertCanConfigure(actor);
    const existing = rules.find((rule) => rule.id === id);
    if (!existing) throw new Error('Rule not found');
    rules = rules.filter((rule) => rule.id !== id);
    auditService.record({ actorId: actor.id, entity: 'automation', entityKey: existing.name, action: 'deleted', summary: 'Rule deleted' });
  },

  /* ---------- Engine (called by taskService) ---------- */

  match(trigger: AutomationTrigger, task: Task, toStatus?: TaskStatus): AutomationRule[] {
    return rules.filter((rule) => ruleMatches(rule, trigger, task, toStatus));
  },

  // For scheduled triggers: true the first time this rule fires for this task and due date
  claimOnce(rule: AutomationRule, task: Task): boolean {
    const key = `${rule.id}:${task.id}:${task.dueDate}`;
    if (firedOnce.has(key)) return false;
    firedOnce.add(key);
    return true;
  },

  markRun(ruleId: string): void {
    const now = new Date().toISOString();
    rules = rules.map((rule) => (rule.id === ruleId ? { ...rule, runCount: rule.runCount + 1, lastRunAt: now } : rule));
  },
};
