import { can, canTransition } from '@/lib/permissions/task-permissions';
import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import { cloneSettings, createDefaultTaskSettings } from '@/lib/task-settings-defaults';
import { getTaskSettings, replaceTaskSettings } from '@/lib/task-settings-store';
import { getBoardColumn, getBoardColumns, getColumnStatuses, isTransitionAllowed } from '@/lib/workflow';
import type { Task, WorkflowSettings } from '@/types';
import { auditService } from '../audit/audit-service';
import { taskSettingsService, validateWorkflow } from './task-settings-service';

const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
const admin = { id: 'ADM001', role: 'admin' as const };
const employee = { id: 'EMP001', role: 'employee' as const };
const task = (overrides: Partial<Task>): Task => ({ ...sampleTasks[0], assigneeId: 'EMP001', ...overrides });
const workflow = (): WorkflowSettings => cloneSettings(getTaskSettings().workflow);

afterEach(() => replaceTaskSettings(createDefaultTaskSettings()));

describe('default workflow', () => {
  it('lets work move freely until Done, then only to Reopened', () => {
    expect(isTransitionAllowed('todo', 'in-progress')).toBe(true);
    expect(isTransitionAllowed('done', 'reopened')).toBe(true);
    expect(isTransitionAllowed('done', 'todo')).toBe(false);
    expect(canTransition(employee, task({ status: 'done' }), 'todo')).toBe(false);
    expect(canTransition(employee, task({ status: 'done' }), 'reopened')).toBe(true);
  });

  it('shows Reopened inside the To Do column', () => {
    expect(getBoardColumns().map((column) => column.status)).toEqual(['todo', 'in-progress', 'in-review', 'done']);
    expect(getBoardColumn('reopened')).toBe('todo');
    expect(getColumnStatuses('todo')).toEqual(['todo', 'reopened']);
  });
});

describe('saving the workflow', () => {
  it('adds a custom status that the board and transitions follow', async () => {
    const next = workflow();
    next.statuses.splice(2, 0, { id: 'qa', label: 'QA', color: 'teal', category: 'active', enabled: true, system: false });
    next.transitions['in-progress'] = ['qa'];
    next.transitions.qa = ['in-review', 'in-progress'];
    await taskSettingsService.saveWorkflow(sysAdmin, next);

    expect(getBoardColumns().map((column) => column.label)).toEqual(['To Do', 'In Progress', 'QA', 'In Review', 'Done']);
    expect(isTransitionAllowed('in-progress', 'qa')).toBe(true);
    expect(isTransitionAllowed('in-progress', 'in-review')).toBe(false);
  });

  it('refuses workflows that would break the module or strand tasks', () => {
    const noTodo = workflow();
    noTodo.statuses = noTodo.statuses.map((status) => (status.id === 'todo' ? { ...status, enabled: false } : status));
    expect(() => validateWorkflow(noTodo)).toThrow("can't be turned off");

    const stuck = workflow();
    stuck.transitions['in-review'] = [];
    expect(() => validateWorkflow(stuck)).toThrow('stuck');

    // Nothing can reach Reopened (Done gets another way out so it isn't the stuck one)
    const unreachable = workflow();
    Object.keys(unreachable.transitions).forEach((from) => {
      unreachable.transitions[from] = unreachable.transitions[from].filter((to) => to !== 'reopened');
    });
    unreachable.transitions.done = ['todo'];
    expect(() => validateWorkflow(unreachable)).toThrow('could never be used');

    const fakeDone = workflow();
    fakeDone.statuses.push({ id: 'shipped', label: 'Shipped', color: 'green', category: 'done', enabled: true, system: false });
    expect(() => validateWorkflow(fakeDone)).toThrow('built in');
  });

  it('is limited to System Admins and recorded in the audit log', async () => {
    await expect(taskSettingsService.saveWorkflow(admin, workflow())).rejects.toThrow('permission');
    await taskSettingsService.saveWorkflow(sysAdmin, workflow());
    const [latest] = await auditService.list(sysAdmin, { entity: 'settings' });
    expect(latest.summary).toContain('Workflow saved');
  });
});

describe('permission matrix', () => {
  it('applies saved changes everywhere can() is used', async () => {
    expect(can(employee, 'task.create')).toBe(true);
    const matrix = cloneSettings(getTaskSettings().permissions);
    matrix['task.create'].employee = 'none';
    await taskSettingsService.savePermissions(sysAdmin, matrix);
    expect(can(employee, 'task.create')).toBe(false);

    await taskSettingsService.reset(sysAdmin, 'permissions');
    expect(can(employee, 'task.create')).toBe(true);
  });

  it('never lets System Admin lose access to Settings', async () => {
    const matrix = cloneSettings(getTaskSettings().permissions);
    matrix['workflow.configure'].system_admin = 'none';
    await expect(taskSettingsService.savePermissions(sysAdmin, matrix)).rejects.toThrow('keep access');
  });
});

describe('fields and labels', () => {
  it('validates labels and keeps one task type on', async () => {
    await expect(taskSettingsService.saveLabels(sysAdmin, [{ name: 'Not Valid!', color: 'sky' }])).rejects.toThrow('lowercase');
    const off = getTaskSettings().issueTypes.map((type) => ({ ...type, enabled: type.type === 'sub-task' }));
    await expect(taskSettingsService.saveFields(sysAdmin, { issueTypes: off, priorities: getTaskSettings().priorities })).rejects.toThrow('at least one');
  });
});
