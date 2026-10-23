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
  getTeamAlerts,
  getWorkload,
  EMPTY_FILTERS,
  filtersToParams,
  matchesAdvancedFilters,
  parseFilters,
  suggestProjectKey,
  filterStateToQuery,
  isQuickFilterActive,
  parseStatusFilter,
  queryToParamChanges,
  toggleQuickFilter,
  type FilterState,
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
    epicId: 'none', sprintId: 'none', estimateHours: '', labels: '', reporterId: 'PM001',
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

describe('workload and alerts', () => {
  const work = [
    task({ id: 'A', parentId: undefined, assigneeId: 'EMP002', status: 'in-progress', estimateHours: 24, loggedHours: 4, dueDate: '2026-10-20', isBlocked: false }),
    task({ id: 'B', parentId: undefined, assigneeId: 'EMP002', status: 'todo', estimateHours: 30, loggedHours: 0, dueDate: '2026-10-10', isBlocked: true }),
    task({ id: 'C', parentId: undefined, assigneeId: 'EMP002', status: 'done', estimateHours: 50, loggedHours: 50, dueDate: '2026-10-01', isBlocked: false }),
  ];

  it('counts remaining hours on open work only', () => {
    const [row] = getWorkload(work, ['EMP002', 'EMP003'], today);
    expect(row).toMatchObject({ openTasks: 2, estimateHours: 54, loggedHours: 4, remainingHours: 50, overdue: 1, blocked: 1 });
    expect(getWorkload(work, ['EMP003'], today)[0].openTasks).toBe(0);
  });

  it('leaves epics out of personal workload', () => {
    const epic = task({ id: 'E', parentId: undefined, type: 'epic', assigneeId: 'PM001', status: 'in-progress', estimateHours: 120, loggedHours: 18 });
    expect(getWorkload([epic], ['PM001'], today)[0]).toMatchObject({ openTasks: 0, remainingHours: 0 });
  });

  it('lists overdue and blocked open work', () => {
    const alerts = getTeamAlerts(work, today);
    expect(alerts.overdue.map((item) => item.id)).toEqual(['B']);
    expect(alerts.blocked.map((item) => item.id)).toEqual(['B']);
  });
});

describe('advanced filters', () => {
  it('round-trips through the URL', () => {
    const filters = { ...EMPTY_FILTERS, projectIds: ['PRJ-IXP'], priorities: ['high' as const, 'urgent' as const], due: 'overdue' as const };
    const params = new URLSearchParams();
    Object.entries(filtersToParams(filters)).forEach(([key, value]) => value && params.set(key, value));
    expect(params.toString()).toBe('project=PRJ-IXP&priority=high%2Curgent&due=overdue');
    expect(parseFilters(params)).toEqual(filters);
  });

  it('ignores unknown due values', () => {
    expect(parseFilters(new URLSearchParams('due=someday')).due).toBe('any');
  });

  it('matches any value within a filter and all filters together', () => {
    const sample = task({ projectId: 'PRJ-IXP', assigneeId: 'EMP001', priority: 'high', type: 'bug', status: 'todo', dueDate: '2026-10-14' });
    expect(matchesAdvancedFilters(sample, EMPTY_FILTERS, today)).toBe(true);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, priorities: ['low', 'high'] }, today)).toBe(true);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, departments: ['Engineering'] }, today)).toBe(true);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, departments: ['Quality'] }, today)).toBe(false);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, priorities: ['high'], types: ['story'] }, today)).toBe(false);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, due: 'overdue' }, today)).toBe(true);
    expect(matchesAdvancedFilters(sample, { ...EMPTY_FILTERS, due: 'next-7' }, today)).toBe(false);
  });
});

it('suggestProjectKey() builds a key from the project name', () => {
  expect(suggestProjectKey('Mobile App')).toBe('MA');
  expect(suggestProjectKey('Payroll')).toBe('PAY');
  expect(suggestProjectKey('Customer Success Team Portal Revamp Two')).toBe('CSTPR');
  expect(suggestProjectKey('')).toBe('');
});

describe('open-only filter', () => {
  it('hides done work and round-trips through the URL', () => {
    const filters = { ...EMPTY_FILTERS, openOnly: true };
    expect(matchesAdvancedFilters(task({ status: 'done' }), filters, today)).toBe(false);
    expect(matchesAdvancedFilters(task({ status: 'in-progress' }), filters, today)).toBe(true);
    expect(filtersToParams(filters).open).toBe('1');
    expect(parseFilters(new URLSearchParams('open=1')).openOnly).toBe(true);
  });
});

describe('parseStatusFilter()', () => {
  it('accepts board columns and blocked, and falls back to all', () => {
    expect(parseStatusFilter('in-review')).toBe('in-review');
    expect(parseStatusFilter('blocked')).toBe('blocked');
    expect(parseStatusFilter('no-such-status')).toBe('all');
    expect(parseStatusFilter(null)).toBe('all');
  });
});

describe('quick filters', () => {
  const none: FilterState = { statusFilter: 'all', filters: EMPTY_FILTERS };

  it('turns each chip on and back off', () => {
    for (const id of ['my-open', 'due-week', 'overdue', 'high-priority', 'blocked'] as const) {
      const on = toggleQuickFilter(id, none, 'EMP001');
      expect(isQuickFilterActive(id, on, 'EMP001')).toBe(true);
      const off = toggleQuickFilter(id, on, 'EMP001');
      expect(isQuickFilterActive(id, off, 'EMP001')).toBe(false);
      expect(off).toEqual(none);
    }
  });

  it('sets the underlying filters, so they show in the Filters panel too', () => {
    expect(toggleQuickFilter('my-open', none, 'EMP001').filters).toMatchObject({ assigneeIds: ['EMP001'], openOnly: true });
    expect(toggleQuickFilter('high-priority', none, 'EMP001').filters.priorities).toEqual(['high', 'urgent']);
    expect(toggleQuickFilter('blocked', none, 'EMP001').statusFilter).toBe('blocked');
  });

  it('swaps between the two due-date chips', () => {
    const overdue = toggleQuickFilter('overdue', none, 'EMP001');
    const week = toggleQuickFilter('due-week', overdue, 'EMP001');
    expect(isQuickFilterActive('overdue', week, 'EMP001')).toBe(false);
    expect(isQuickFilterActive('due-week', week, 'EMP001')).toBe(true);
  });

  it('only counts My open for the same person', () => {
    const mine = toggleQuickFilter('my-open', none, 'EMP001');
    expect(isQuickFilterActive('my-open', mine, 'EMP002')).toBe(false);
  });
});

describe('saved filter queries', () => {
  it('is stable regardless of the order filters were set in', () => {
    const state: FilterState = { statusFilter: 'blocked', filters: { ...EMPTY_FILTERS, due: 'overdue', priorities: ['high', 'urgent'] } };
    expect(filterStateToQuery(state)).toBe('due=overdue&priority=high%2Curgent&status=blocked');
    expect(filterStateToQuery({ statusFilter: 'all', filters: EMPTY_FILTERS })).toBe('');
  });

  it('applies a saved query and clears every other filter parameter', () => {
    const changes = queryToParamChanges('due=overdue&priority=high%2Curgent');
    expect(changes).toMatchObject({ due: 'overdue', priority: 'high,urgent', status: null, project: null, assignee: null, open: null });
  });
});
