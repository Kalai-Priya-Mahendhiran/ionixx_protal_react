import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import type { AutomationRule, Task } from '@/types';
import { auditService } from '../audit/audit-service';
import { notificationService } from '../notifications/notification-service';
import { taskService } from '../tasks/task-service';
import { automationService, ruleMatches, validateRule } from './automation-service';

const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
const manager = { id: 'PM001', role: 'project_manager' as const };
const employee = { id: 'EMP001', role: 'employee' as const };

const baseRule: AutomationRule = {
  id: 'R',
  name: 'Test',
  enabled: true,
  trigger: 'status-changed',
  triggerStatus: 'in-review',
  conditions: [{ field: 'priority', operator: 'is', value: 'high' }],
  actions: [{ kind: 'notify', recipient: 'assignee' }],
  runCount: 0,
  updatedById: 'SYS001',
  updatedAt: '',
};
const task = (overrides: Partial<Task>): Task => ({ ...sampleTasks[0], ...overrides });

describe('rule matching', () => {
  it('needs the trigger, the target status and every condition', () => {
    expect(ruleMatches(baseRule, 'status-changed', task({ priority: 'high' }), 'in-review')).toBe(true);
    expect(ruleMatches(baseRule, 'status-changed', task({ priority: 'low' }), 'in-review')).toBe(false);
    expect(ruleMatches(baseRule, 'status-changed', task({ priority: 'high' }), 'done')).toBe(false);
    expect(ruleMatches(baseRule, 'assigned', task({ priority: 'high' }))).toBe(false);
    expect(ruleMatches({ ...baseRule, enabled: false }, 'status-changed', task({ priority: 'high' }), 'in-review')).toBe(false);
  });

  it('validates rules', () => {
    expect(() => validateRule({ ...baseRule, name: ' ' })).toThrow('name');
    expect(() => validateRule({ ...baseRule, actions: [] })).toThrow('action');
  });
});

describe('rules running on task events', () => {
  it('tells the manager once about overdue work (When due date passes AND status is not Done)', async () => {
    await taskService.list(employee);
    await taskService.list(employee); // a second check must not notify again
    const titles = (await notificationService.list(manager)).map((item) => item.title);
    expect(titles.filter((title) => title === 'Overdue work → tell the manager: IXP-103')).toHaveLength(1);
  });

  it('raises the priority of reopened work and records it as Automation', async () => {
    const done = (await taskService.list(employee)).find((item) => item.key === 'IXP-101')!; // done, medium
    await taskService.changeStatus(employee, done.id, 'reopened');
    const reopened = (await taskService.list(employee)).find((item) => item.id === done.id)!;
    expect(reopened.priority).toBe('high');
    const entries = await auditService.list(sysAdmin, { actorId: 'system' });
    expect(entries.some((entry) => entry.entityKey === 'IXP-101' && entry.summary.startsWith('Priority: medium → high'))).toBe(true);
  });

  it('lets System Admins manage rules and keeps others out', async () => {
    const created = await automationService.create(sysAdmin, { ...baseRule, name: 'Review ping' });
    expect(created.runCount).toBe(0);
    await automationService.remove(sysAdmin, created.id);
    await expect(automationService.list(employee)).rejects.toThrow('permission');
  });
});
