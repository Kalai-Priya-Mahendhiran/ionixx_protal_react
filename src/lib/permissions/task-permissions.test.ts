import type { UserRole } from '@/lib/mock-users';
import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import type { Task } from '@/types';
import {
  DEFAULT_TASK_VIEW,
  can,
  canApprove,
  canManageSprints,
  canReassign,
  getManagerSections,
  getSectionsForView,
  canCreateSubtask,
  canCreateTask,
  canTransition,
  getAssignableUsers,
  getSubtaskType,
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
  it('limits HR to HR-type tasks only, even project work they are involved in', () => {
    expect(getVisibleTasks(hr, sampleTasks).every((task) => task.type === 'hr')).toBe(true);
    expect(can(hr, 'task.view', makeTask({ type: 'task', assigneeId: 'HR001', reporterId: 'HR001' }))).toBe(false);
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

describe('Phase 2 rules', () => {
  it('lets watchers see and comment on a task, but not edit it', () => {
    const watched = makeTask({ assigneeId: 'EMP002', reporterId: 'PM001', watcherIds: ['EMP001'] });
    expect(can(employee, 'task.view', watched)).toBe(true);
    expect(can(employee, 'task.comment', watched)).toBe(true);
    expect(can(employee, 'task.edit', watched)).toBe(false);
    expect(can(employee, 'task.logWork', watched)).toBe(false);
  });

  it('shows every sub-task of a visible parent', () => {
    const parent = makeTask({ id: 'P1', assigneeId: 'EMP001' });
    const othersSubtask = makeTask({ id: 'S1', parentId: 'P1', type: 'sub-task', assigneeId: 'EMP002', reporterId: 'EMP002' });
    const unrelated = makeTask({ id: 'S2', parentId: 'NOPE', type: 'sub-task', assigneeId: 'EMP002', reporterId: 'EMP002' });
    expect(getVisibleTasks(employee, [parent, othersSubtask, unrelated]).map((task) => task.id)).toEqual(['P1', 'S1']);
  });

  it('lets employees add sub-tasks only for themselves, managers for their team', () => {
    const parent = makeTask({ assigneeId: 'EMP001' });
    expect(canCreateSubtask(employee, parent, 'EMP001')).toBe(true);
    expect(canCreateSubtask(employee, parent, 'EMP002')).toBe(false);
    expect(canCreateSubtask(manager, parent, 'EMP002')).toBe(true);
    expect(canCreateSubtask(manager, parent, 'HR001')).toBe(false);
  });

  it('treats sub-tasks of HR work as HR work', () => {
    const hrParent = makeTask({ type: 'hr', assigneeId: 'HR001', reporterId: 'HR001' });
    expect(getSubtaskType(hrParent)).toBe('hr');
    expect(canCreateSubtask(hr, hrParent, 'SYS001')).toBe(true);
  });

  it('gives executives watch but not comment or log work', () => {
    expect(can(executive, 'task.watch', outsideTask)).toBe(true);
    expect(can(executive, 'task.comment', outsideTask)).toBe(false);
    expect(can(executive, 'task.logWork', outsideTask)).toBe(false);
  });
});

describe('Phase 3 manager rules', () => {
  const ixp = { leadId: 'PM001', memberIds: ['PM001', 'EMP001'] };
  const hrProject = { leadId: 'HR001', memberIds: ['HR001'] };

  it('lets managers plan sprints only in their projects; admins everywhere; employees nowhere', () => {
    expect(canManageSprints(manager, ixp)).toBe(true);
    expect(canManageSprints(manager, hrProject)).toBe(false);
    expect(canManageSprints(admin, hrProject)).toBe(true);
    expect(canManageSprints(employee, ixp)).toBe(false);
    expect(canManageSprints(hr, hrProject)).toBe(false);
  });

  it('approves team work in review, but never your own', () => {
    const inReview = makeTask({ status: 'in-review', assigneeId: 'EMP002', reporterId: 'EMP002' });
    expect(canApprove(manager, inReview)).toBe(true);
    expect(canApprove(manager, { ...inReview, assigneeId: 'PM001' })).toBe(false);
    expect(canApprove(manager, { ...inReview, status: 'in-progress' })).toBe(false);
    expect(canApprove(employee, inReview)).toBe(false);
  });

  it('reassigns only to people the user may assign to', () => {
    expect(canReassign(manager, teamTask, 'EMP003')).toBe(true);
    expect(canReassign(manager, teamTask, 'HR001')).toBe(false);
    expect(canReassign(employee, makeTask(), 'EMP002')).toBe(false);
  });

  it('shows manager tools by role', () => {
    expect(getManagerSections(manager)).toEqual(['board', 'workload', 'sprints', 'approvals']);
    expect(getManagerSections(admin)).toEqual(['board', 'workload', 'sprints', 'approvals']);
    expect(getManagerSections(sysAdmin)).toEqual(['board', 'workload', 'sprints']);
    expect(getManagerSections(employee)).toEqual(['board']);
    expect(getManagerSections(executive)).toEqual(['board']);
  });
});

describe('Phase 4 HR rules', () => {
  it('lets HR, admins and system admins manage templates', () => {
    expect(can(hr, 'template.manage')).toBe(true);
    expect(can(admin, 'template.manage')).toBe(true);
    expect(can(sysAdmin, 'template.manage')).toBe(true);
    expect(can(manager, 'template.manage')).toBe(false);
    expect(can(employee, 'template.manage')).toBe(false);
  });

  it('shows HR tools on the HR view and manager tools on team views', () => {
    expect(getSectionsForView(hr, 'hr-tasks')).toEqual(['board', 'checklists', 'templates']);
    expect(getSectionsForView(admin, 'hr-tasks')).toEqual(['board', 'checklists', 'templates']);
    expect(getSectionsForView(manager, 'team-board')).toEqual(['board', 'workload', 'sprints', 'approvals']);
    expect(getSectionsForView(manager, 'my-tasks')).toEqual(['board']);
  });
});
