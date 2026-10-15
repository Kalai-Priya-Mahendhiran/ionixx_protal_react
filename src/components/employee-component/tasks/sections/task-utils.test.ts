import { sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import type { Task } from '@/types';
import { taskSchema } from '@/lib/schemas';
import {
  countByStatusFilter,
  filterTasksForView,
  getDueState,
  getDurationDays,
  getSubtaskProgress,
  matchesMyTasksTab,
  matchesSearch,
  matchesStatusFilter,
  parseLabels,
} from './task-utils';

const today = new Date(2026, 9, 15); // Oct 15, 2026 (local time)
const task = (overrides: Partial<Task>): Task => ({ ...sampleTasks[0], ...overrides });

describe('getDueState()', () => {
  it('flags overdue, due-soon and upcoming tasks', () => {
    expect(getDueState({ dueDate: '2026-10-14', status: 'todo' }, today)).toBe('overdue');
    expect(getDueState({ dueDate: '2026-10-15', status: 'todo' }, today)).toBe('due-soon');
    expect(getDueState({ dueDate: '2026-10-17', status: 'todo' }, today)).toBe('due-soon');
    expect(getDueState({ dueDate: '2026-10-18', status: 'todo' }, today)).toBe('upcoming');
  });

  it('never flags finished work', () => {
    expect(getDueState({ dueDate: '2026-10-01', status: 'done' }, today)).toBe('done');
  });
});

describe('status filters', () => {
  it('counts reopened tasks as To Do and ignores blocked flags on done tasks', () => {
    expect(matchesStatusFilter(task({ status: 'reopened' }), 'todo')).toBe(true);
    expect(matchesStatusFilter(task({ status: 'done', isBlocked: true }), 'blocked')).toBe(false);
    expect(matchesStatusFilter(task({ status: 'in-progress', isBlocked: true }), 'blocked')).toBe(true);
  });

  it('counts every filter', () => {
    const counts = countByStatusFilter([task({ status: 'todo' }), task({ status: 'done' }), task({ status: 'in-review' })]);
    expect(counts).toMatchObject({ all: 3, todo: 1, done: 1, 'in-review': 1, 'in-progress': 0 });
  });
});

describe('matchesSearch()', () => {
  it('matches key, title and people names case-insensitively', () => {
    const sample = task({ key: 'IXP-103', title: 'Login fails', assigneeId: 'EMP001' });
    expect(matchesSearch(sample, 'ixp-103')).toBe(true);
    expect(matchesSearch(sample, 'LOGIN')).toBe(true);
    expect(matchesSearch(sample, 'kalai')).toBe(true);
    expect(matchesSearch(sample, 'nothing here')).toBe(false);
  });
});

it('parseLabels() trims, drops blanks and de-duplicates', () => {
  expect(parseLabels(' ui, api ,, ui ')).toEqual(['ui', 'api']);
});

it('getDurationDays() counts both the start and due day', () => {
  expect(getDurationDays('2026-10-15', '2026-10-15')).toBe(1);
  expect(getDurationDays('2026-10-13', '2026-10-26')).toBe(14);
});

describe('taskSchema dates', () => {
  const base = {
    title: 'A task', description: '', projectId: 'PRJ-IXP', type: 'task', priority: 'medium', assigneeId: 'EMP001',
    epicId: 'none', sprintId: 'none', estimateHours: '', labels: '',
  };

  it('rejects a due date before the start date', () => {
    const result = taskSchema.safeParse({ ...base, startDate: '2026-10-20', dueDate: '2026-10-18' });
    expect(result.success).toBe(false);
  });

  it('accepts an empty start date', () => {
    expect(taskSchema.safeParse({ ...base, startDate: '', dueDate: '2026-10-18' }).success).toBe(true);
  });
});

describe('My Tasks tabs and sub-tasks', () => {
  it('splits my work into open tabs and Completed', () => {
    const mine = task({ assigneeId: 'EMP001', reporterId: 'PM001', status: 'in-progress', watcherIds: [] });
    const finished = task({ assigneeId: 'EMP001', status: 'done' });
    const watched = task({ assigneeId: 'EMP002', reporterId: 'PM001', status: 'todo', watcherIds: ['EMP001'] });
    expect(matchesMyTasksTab(mine, 'assigned', 'EMP001')).toBe(true);
    expect(matchesMyTasksTab(finished, 'assigned', 'EMP001')).toBe(false);
    expect(matchesMyTasksTab(finished, 'completed', 'EMP001')).toBe(true);
    expect(matchesMyTasksTab(watched, 'watching', 'EMP001')).toBe(true);
  });

  it('keeps sub-tasks out of views and counts them per parent', () => {
    const parent = task({ id: 'P', parentId: undefined, assigneeId: 'EMP001' });
    const childDone = task({ id: 'C1', parentId: 'P', status: 'done', assigneeId: 'EMP001' });
    const childOpen = task({ id: 'C2', parentId: 'P', status: 'todo', assigneeId: 'EMP001' });
    expect(filterTasksForView('my-tasks', [parent, childDone, childOpen], 'EMP001').map((item) => item.id)).toEqual(['P']);
    expect(getSubtaskProgress([parent, childDone, childOpen]).get('P')).toEqual({ done: 1, total: 2 });
  });
});
