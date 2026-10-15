import type { TaskInput } from '@/types';
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
