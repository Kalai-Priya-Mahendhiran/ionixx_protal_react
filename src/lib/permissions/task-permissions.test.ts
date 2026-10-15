import type { UserRole } from '@/lib/mock-users';
import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import type { Task } from '@/types';
import {
  DEFAULT_TASK_VIEW,
  can,
  canCreateTask,
  canTransition,
  getAssignableUsers,
  getVisibleTasks,
  isTaskReadOnly,
  resolveTaskView,
  type PermissionUser,
} from './task-permissions';

const employee: PermissionUser = { id: 'EMP001', role: 'employee' };
const otherEmployee: PermissionUser = { id: 'EMP002', role: 'employee' };
const manager: PermissionUser = { id: 'PM001', role: 'project_manager' };
const hr: PermissionUser = { id: 'HR001', role: 'hr' };
const admin: PermissionUser = { id: 'ADM001', role: 'admin' };
const sysAdmin: PermissionUser = { id: 'SYS001', role: 'system_admin' };
const executive: PermissionUser = { id: 'EXE001', role: 'executive' };

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  ...sampleTasks[0],
  status: 'todo',
  type: 'task',
  assigneeId: 'EMP001',
  reporterId: 'PM001',
  ...overrides,
});

// Assigned to a manager's direct report (EMP002 reports to PM001)
const teamTask = makeTask({ assigneeId: 'EMP002', reporterId: 'EMP002' });
// Nobody on PM001's team is involved
const outsideTask = makeTask({ assigneeId: 'SYS001', reporterId: 'ADM001' });
const hrTask = makeTask({ type: 'hr', assigneeId: 'EMP003', reporterId: 'ADM001' });

describe('can()', () => {
  it('returns false with no user', () => {
    expect(can(null, 'task.view')).toBe(false);
  });

  describe('employee', () => {
    it('sees and edits only their own tasks', () => {
      expect(can(employee, 'task.view', makeTask())).toBe(true);
      expect(can(employee, 'task.edit', makeTask())).toBe(true);
      expect(can(otherEmployee, 'task.view', makeTask())).toBe(false);
      expect(can(otherEmployee, 'task.edit', makeTask())).toBe(false);
    });

    it('can create tasks only for themselves and never assign, delete or approve', () => {
      expect(canCreateTask(employee, { assigneeId: 'EMP001', type: 'task' })).toBe(true);
      expect(canCreateTask(employee, { assigneeId: 'EMP002', type: 'task' })).toBe(false);
      expect(can(employee, 'task.assign')).toBe(false);
      expect(can(employee, 'task.delete', makeTask())).toBe(false);
      expect(can(employee, 'task.approve', makeTask())).toBe(false);
    });
  });

  describe('manager', () => {
    it('acts on team tasks but not on tasks outside the team', () => {
      for (const action of ['task.view', 'task.edit', 'task.delete', 'task.approve'] as const) {
        expect(can(manager, action, teamTask)).toBe(true);
        expect(can(manager, action, outsideTask)).toBe(false);
      }
    });

    it('can assign only to team members', () => {
      expect(canCreateTask(manager, { assigneeId: 'EMP002', type: 'task' })).toBe(true);
      expect(canCreateTask(manager, { assigneeId: 'HR001', type: 'task' })).toBe(false);
      expect(getAssignableUsers(manager).map((user) => user.id)).toEqual(
        expect.arrayContaining(['PM001', 'EMP001', 'EMP002', 'EMP006']),
      );
      expect(getAssignableUsers(manager).map((user) => user.id)).not.toContain('HR001');
    });
  });

  describe('hr', () => {
    it('works on HR-type tasks only and cannot approve', () => {
      expect(can(hr, 'task.view', hrTask)).toBe(true);
      expect(can(hr, 'task.delete', hrTask)).toBe(true);
      expect(can(hr, 'task.view', outsideTask)).toBe(false);
      expect(canCreateTask(hr, { assigneeId: 'EMP001', type: 'hr' })).toBe(true);
      expect(canCreateTask(hr, { assigneeId: 'EMP001', type: 'bug' })).toBe(false);
      expect(can(hr, 'task.approve', hrTask)).toBe(false);
    });
  });

  it('gives admin everything except workflow configuration', () => {
    for (const action of ['task.view', 'task.create', 'task.assign', 'task.edit', 'task.delete', 'task.approve'] as const) {
      expect(can(admin, action, outsideTask)).toBe(true);
    }
    expect(can(admin, 'workflow.configure')).toBe(false);
  });

  it('gives system admin workflow configuration but not approval', () => {
    expect(can(sysAdmin, 'workflow.configure')).toBe(true);
    expect(can(sysAdmin, 'task.edit', teamTask)).toBe(true);
    expect(can(sysAdmin, 'task.approve', teamTask)).toBe(false);
  });

  it('keeps executive read only', () => {
    expect(can(executive, 'task.view', outsideTask)).toBe(true);
    for (const action of ['task.create', 'task.assign', 'task.edit', 'task.changeStatus', 'task.delete', 'task.approve'] as const) {
      expect(can(executive, action, outsideTask)).toBe(false);
    }
    expect(isTaskReadOnly(executive)).toBe(true);
    expect(isTaskReadOnly(employee)).toBe(false);
  });
});

describe('canTransition()', () => {
  const inReview = makeTask({ status: 'in-review' });

  it('needs approval rights to move In Review to Done', () => {
    expect(canTransition(employee, inReview, 'done')).toBe(false);
    expect(canTransition(manager, inReview, 'done')).toBe(true);
    expect(canTransition(employee, inReview, 'in-progress')).toBe(true);
  });

  it('rejects moving to the current status', () => {
    expect(canTransition(admin, inReview, 'in-review')).toBe(false);
  });
});

describe('getVisibleTasks()', () => {
  it('limits HR to HR tasks plus their own', () => {
    expect(getVisibleTasks(hr, sampleTasks).every((task) => task.type === 'hr' || task.assigneeId === 'HR001')).toBe(true);
  });

  it('shows admin every task', () => {
    expect(getVisibleTasks(admin, sampleTasks)).toHaveLength(sampleTasks.length);
  });
});

describe('resolveTaskView()', () => {
  it.each(Object.entries(DEFAULT_TASK_VIEW) as [UserRole, string][])('defaults %s to %s', (role, view) => {
    expect(resolveTaskView({ id: 'X', role }, null)).toBe(view);
  });

  it('falls back to the default when the requested view is not allowed', () => {
    expect(resolveTaskView(employee, 'settings')).toBe('my-tasks');
    expect(resolveTaskView(admin, 'team-board')).toBe('team-board');
  });
});
