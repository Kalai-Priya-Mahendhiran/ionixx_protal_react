import type { TaskInput } from '@/types';
import { notificationService } from '../notifications/notification-service';
import { timeEntryService } from '../time-tracker/time-entry-service';
import { taskService } from './task-service';

const manager = { id: 'PM001', role: 'project_manager' as const };

const input = (overrides: Partial<TaskInput> = {}): TaskInput => ({
  projectId: 'PRJ-IXP',
  type: 'task',
  title: 'Planning link test',
  description: '',
  priority: 'medium',
  assigneeId: 'EMP001',
  dueDate: '2026-12-01',
  labels: [],
  attachments: [],
  ...overrides,
});

describe('taskService planning links', () => {
  it('creates a task in the active sprint under an epic', async () => {
    const task = await taskService.create(manager, input({ sprintId: 'SPR-IXP-15', epicId: 'TSK-EPIC-1' }));
    expect(task).toMatchObject({ sprintId: 'SPR-IXP-15', epicId: 'TSK-EPIC-1', reporterId: 'PM001', status: 'todo' });
    expect(task.key).toMatch(/^IXP-\d+$/);
  });

  it('rejects a completed sprint and an epic from another project', async () => {
    await expect(taskService.create(manager, input({ sprintId: 'SPR-IXP-14' }))).rejects.toThrow('already completed');
    await expect(taskService.create(manager, input({ projectId: 'PRJ-HR', type: 'hr', epicId: 'TSK-EPIC-1' }))).rejects.toThrow(
      'same project',
    );
  });

  it('only lists sprints of projects the user belongs to', async () => {
    expect(await taskService.listSprints({ id: 'HR001', role: 'hr' })).toEqual([]);
    expect((await taskService.listSprints(manager)).length).toBe(3);
  });
});

describe('taskService Phase 2', () => {
  const employee = { id: 'EMP001', role: 'employee' as const };
  const findByKey = async (key: string) => (await taskService.list(employee)).find((task) => task.key === key)!;

  it('logs work on the task and files it in the Time Tracker', async () => {
    const before = await findByKey('IXP-103');
    await taskService.logWork(employee, before.id, { date: '2026-10-14', startTime: '10:00', hours: 1.5, note: 'Reproduced on iOS 17' });

    expect((await findByKey('IXP-103')).loggedHours).toBe(before.loggedHours + 1.5);
    const [entry] = await timeEntryService.list(employee);
    expect(entry).toMatchObject({
      taskId: before.id,
      startTime: '10:00',
      endTime: '11:30',
      totalHours: 1.5,
      task: 'IXP-103: Login fails on mobile Safari',
    });
  });

  it('notifies the manager when a task is flagged as blocked, and needs a reason', async () => {
    const task = await findByKey('IXP-103');
    await taskService.setBlocked(employee, task.id, true, 'Need an iOS test device');
    const [latest] = await notificationService.list(manager);
    expect(latest).toMatchObject({ title: 'IXP-103 is blocked', type: 'warning', actionUrl: '/tasks/IXP-103' });
    await expect(taskService.setBlocked(employee, task.id, true, '  ')).rejects.toThrow('reason');
  });

  it('notifies people mentioned in a comment', async () => {
    const task = await findByKey('IXP-102');
    await taskService.addComment(employee, task.id, '@Priya Kumar can you check this?', ['PM001']);
    const [latest] = await notificationService.list(manager);
    expect(latest.title).toBe('Kalai Priya mentioned you on IXP-102');
  });

  it('creates sub-tasks under the parent, but employees cannot assign them to others', async () => {
    const parent = await findByKey('IXP-105');
    const subtask = await taskService.createSubtask(employee, parent.id, { title: 'Draft slides', assigneeId: 'EMP001' });
    expect(subtask).toMatchObject({ parentId: parent.id, type: 'sub-task', projectId: 'PRJ-IXP', dueDate: parent.dueDate });
    await expect(taskService.createSubtask(employee, parent.id, { title: 'Other', assigneeId: 'EMP002' })).rejects.toThrow(
      'add a sub-task',
    );
  });
});

describe('taskService Phase 3', () => {
  const employee = { id: 'EMP001', role: 'employee' as const };
  const keyOf = async (key: string) => (await taskService.list(manager)).find((task) => task.key === key)!;

  it('asks the approver to review work moved to In Review', async () => {
    const task = (await taskService.list(employee)).find((item) => item.key === 'IXP-105')!;
    await taskService.changeStatus(employee, task.id, 'in-review');
    const [latest] = await notificationService.list(manager);
    expect(latest.title).toBe('IXP-105 is ready for your review');
  });

  it('approves to Done and tells the assignee', async () => {
    const task = await keyOf('IXP-121');
    const approved = await taskService.approve(manager, task.id);
    expect(approved.status).toBe('done');
    const [latest] = await notificationService.list({ id: 'EMP005', role: 'employee' });
    expect(latest.title).toBe('IXP-121 approved');
  });

  it('sends back to In Progress only with a comment, and posts that comment', async () => {
    const task = await keyOf('IXP-108');
    await expect(taskService.sendBack(manager, task.id, 'no')).rejects.toThrow('Explain');
    const sent = await taskService.sendBack(manager, task.id, 'Badge contrast fails on dark rows');
    expect(sent.status).toBe('in-progress');
    const comments = await taskService.listComments(manager, task.id);
    expect(comments.at(-1)?.body).toBe('Sent back for changes: Badge contrast fails on dark rows');
  });

  it('reassigns within the team only', async () => {
    const task = await keyOf('IXP-120');
    expect((await taskService.reassign(manager, task.id, 'EMP002')).assigneeId).toBe('EMP002');
    await expect(taskService.reassign(manager, task.id, 'HR001')).rejects.toThrow("can't assign");
  });

  it('plans sprints: one active per project, unfinished work moves on completion', async () => {
    await expect(taskService.startSprint(manager, 'SPR-IXP-16')).rejects.toThrow('Complete IXP Sprint 15');

    const backlogItem = await keyOf('IXP-119');
    await taskService.moveToSprint(manager, backlogItem.id, 'SPR-IXP-15');
    await expect(taskService.moveToSprint(employee, (await taskService.list(employee))[0].id, null)).rejects.toThrow("can't plan");

    const { moved } = await taskService.completeSprint(manager, 'SPR-IXP-15', 'SPR-IXP-16');
    expect(moved).toBeGreaterThan(0);
    expect((await keyOf('IXP-119')).sprintId).toBe('SPR-IXP-16');
    expect((await taskService.startSprint(manager, 'SPR-IXP-16')).status).toBe('active');

    const created = await taskService.createSprint(manager, { projectId: 'PRJ-IXP', name: 'IXP Sprint 17', startDate: '2026-11-09', endDate: '2026-11-22' });
    expect(created.status).toBe('planned');
    await expect(
      taskService.createSprint(employee, { projectId: 'PRJ-IXP', name: 'Mine', startDate: '2026-11-09', endDate: '2026-11-22' }),
    ).rejects.toThrow("can't plan");
  });
});

describe('taskService Phase 4', () => {
  const hrUser = { id: 'HR001', role: 'hr' as const };
  const employee = { id: 'EMP001', role: 'employee' as const };

  it('applies a template as one HR checklist with an owned, dated sub-task per item', async () => {
    const checklist = await taskService.applyTemplate(hrUser, 'TPL-ONBOARDING', 'EMP007', '2026-10-22');
    expect(checklist).toMatchObject({ type: 'hr', title: 'Onboarding: Sneha Reddy', subjectId: 'EMP007', templateId: 'TPL-ONBOARDING', assigneeId: 'HR001' });
    expect(checklist.key).toMatch(/^HR-\d+$/);

    const items = (await taskService.list(hrUser)).filter((task) => task.parentId === checklist.id);
    expect(items).toHaveLength(10);
    expect(items.every((task) => task.type === 'hr')).toBe(true);
    expect(new Set(items.map((task) => task.assigneeId))).toEqual(new Set(['SYS001', 'HR001', 'PM001', 'EMP007']));

    // The IT owner gets one notification covering all three of their items
    const [latest] = await notificationService.list({ id: 'SYS001', role: 'system_admin' });
    expect(latest.title).toBe('3 onboarding tasks for Sneha Reddy');
  });

  it('refuses a second open checklist from the same template for the same person', async () => {
    await expect(taskService.applyTemplate(hrUser, 'TPL-ONBOARDING', 'EMP007', '2026-10-22')).rejects.toThrow('already has an open');
  });

  it('only lets template managers apply templates', async () => {
    await expect(taskService.applyTemplate(employee, 'TPL-OFFBOARDING', 'EMP002', '2026-11-01')).rejects.toThrow("can't apply");
  });
});
