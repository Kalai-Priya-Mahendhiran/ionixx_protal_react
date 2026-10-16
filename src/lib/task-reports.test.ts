import { finishedInLastWeek, getBurndown, getEpicProgress, getProjectProgress, getRisks, getWeeklyThroughput, startOfWeek, summarize } from '@/lib/task-reports';
import type { Project, Sprint, Task } from '@/types';

const TODAY = new Date(2026, 9, 15, 12); // Thursday 15 Oct 2026

let seq = 0;
function makeTask(overrides: Partial<Task> = {}): Task {
  seq += 1;
  return {
    id: `T${seq}`,
    key: `IXP-${seq}`,
    projectId: 'P1',
    type: 'task',
    title: `Task ${seq}`,
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'EMP001',
    reporterId: 'MGR001',
    watcherIds: [],
    labels: [],
    dueDate: '2026-10-30',
    loggedHours: 0,
    isBlocked: false,
    attachments: [],
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
    ...overrides,
  } as Task;
}

const project = (id: string, key: string): Project => ({ id, key, name: key, leadId: 'MGR001', memberIds: [], defaultIssueType: 'task' });

describe('summarize()', () => {
  it('counts top-level work only, ignoring epics and sub-tasks', () => {
    const tasks = [
      makeTask({ status: 'done' }),
      makeTask({ dueDate: '2026-10-01' }), // overdue
      makeTask({ isBlocked: true }),
      makeTask({ type: 'epic' }),
      makeTask({ parentId: 'T1' }),
    ];
    expect(summarize(tasks, TODAY)).toEqual({ total: 3, done: 1, open: 2, overdue: 1, blocked: 1, percentComplete: 33 });
  });

  it('is 0% with no work rather than dividing by zero', () => {
    expect(summarize([], TODAY).percentComplete).toBe(0);
  });

  it('does not count a done task as overdue or blocked', () => {
    expect(summarize([makeTask({ status: 'done', dueDate: '2026-01-01', isBlocked: true })], TODAY)).toMatchObject({ overdue: 0, blocked: 0 });
  });
});

describe('getProjectProgress()', () => {
  it('groups by project, drops empty projects and puts the largest first', () => {
    const tasks = [makeTask({ projectId: 'P2' }), makeTask({ projectId: 'P1', status: 'done' }), makeTask({ projectId: 'P1' })];
    const rows = getProjectProgress(tasks, [project('P2', 'B'), project('P1', 'A'), project('P3', 'C')], TODAY);
    expect(rows.map((row) => [row.project.key, row.total, row.percentComplete])).toEqual([
      ['A', 2, 50],
      ['B', 1, 0],
    ]);
  });
});

describe('getWeeklyThroughput()', () => {
  it('starts weeks on Monday', () => {
    expect(startOfWeek(TODAY).getDay()).toBe(1);
    expect(startOfWeek(new Date(2026, 9, 18)).getDate()).toBe(12); // Sunday belongs to the week before
  });

  it('buckets created and completed dates by week and adds history before the live weeks', () => {
    const tasks = [
      makeTask({ createdAt: '2026-10-13T10:00:00.000Z', status: 'done', completedAt: '2026-10-14T10:00:00.000Z' }),
      makeTask({ createdAt: '2026-10-06T10:00:00.000Z' }),
    ];
    const weeks = getWeeklyThroughput(tasks, 4, TODAY, [
      { created: 5, completed: 3 },
      { created: 6, completed: 4 },
    ]);
    expect(weeks.map((week) => week.weekStart)).toEqual(['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12']);
    expect(weeks.map((week) => [week.created, week.completed])).toEqual([
      [0, 0],
      [5, 3],
      [7, 4],
      [1, 1],
    ]);
    expect(weeks[3].label).toBe('This week');
  });
});

describe('getBurndown()', () => {
  const sprint: Sprint = { id: 'S1', projectId: 'P1', name: 'Sprint 1', startDate: '2026-10-12', endDate: '2026-10-16', status: 'active' };

  it('draws an ideal line from scope to zero and actual remaining up to today', () => {
    const tasks = [
      makeTask({ sprintId: 'S1', status: 'done', completedAt: '2026-10-13T10:00:00' }),
      makeTask({ sprintId: 'S1', status: 'done', completedAt: '2026-10-15T08:00:00' }),
      makeTask({ sprintId: 'S1' }),
      makeTask({ sprintId: 'S1' }),
      makeTask({ sprintId: 'S2' }),
    ];
    const { scope, remaining, points } = getBurndown(tasks, sprint, TODAY);
    expect(scope).toBe(4);
    expect(remaining).toBe(2);
    expect(points.map((point) => point.ideal)).toEqual([4, 3, 2, 1, 0]);
    expect(points.map((point) => point.remaining)).toEqual([4, 3, 3, 2, null]);
  });
});

describe('getRisks()', () => {
  it('lists high and urgent work that is overdue or blocked, urgent first then by due date', () => {
    const overdueHigh = makeTask({ priority: 'high', dueDate: '2026-10-01' });
    const blockedUrgent = makeTask({ priority: 'urgent', isBlocked: true, dueDate: '2026-11-01' });
    const olderHigh = makeTask({ priority: 'high', dueDate: '2026-09-20' });
    const tasks = [
      overdueHigh,
      blockedUrgent,
      olderHigh,
      makeTask({ priority: 'medium', dueDate: '2026-10-01' }), // not high enough
      makeTask({ priority: 'high' }), // on time and not blocked
      makeTask({ priority: 'urgent', status: 'done', dueDate: '2026-10-01' }), // finished
    ];
    expect(getRisks(tasks, TODAY).map((task) => task.id)).toEqual([blockedUrgent.id, olderHigh.id, overdueHigh.id]);
  });
});

describe('getEpicProgress()', () => {
  it('measures each epic by its direct work items', () => {
    const epic = makeTask({ type: 'epic' });
    const tasks = [epic, makeTask({ epicId: epic.id, status: 'done' }), makeTask({ epicId: epic.id }), makeTask({ epicId: epic.id, parentId: 'X' })];
    expect(getEpicProgress(tasks)).toEqual([{ epic, total: 2, done: 1, percent: 50 }]);
  });
});

describe('finishedInLastWeek()', () => {
  it('counts work finished in the last 7 days', () => {
    const tasks = [
      makeTask({ status: 'done', completedAt: '2026-10-14T10:00:00' }),
      makeTask({ status: 'done', completedAt: '2026-10-01T10:00:00' }),
      makeTask({ status: 'done', completedAt: '2026-10-14T10:00:00', parentId: 'T1' }),
    ];
    expect(finishedInLastWeek(tasks, TODAY)).toBe(1);
  });
});
