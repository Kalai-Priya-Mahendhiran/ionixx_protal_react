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
