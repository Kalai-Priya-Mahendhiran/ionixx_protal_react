import type { TaskInput } from '@/types';
import { notificationService } from '../notifications/notification-service';
import { timeEntryService } from '../time-tracker/time-entry-service';
import { requestService } from '../service-desk/request-service';
import { taskService } from './task-service';
import { toUpdateInput } from '@/components/employee-component/tasks/sections/task-utils';

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
    // Read-only roles can't plan; project members (employees included) can
    const executive = { id: 'EXE001', role: 'executive' as const };
    await expect(taskService.moveToSprint(executive, (await taskService.list(executive))[0].id, null)).rejects.toThrow("can't plan");

    const { moved } = await taskService.completeSprint(manager, 'SPR-IXP-15', 'SPR-IXP-16');
    expect(moved).toBeGreaterThan(0);
    expect((await keyOf('IXP-119')).sprintId).toBe('SPR-IXP-16');
    expect((await taskService.startSprint(manager, 'SPR-IXP-16')).status).toBe('active');

    const created = await taskService.createSprint(manager, { projectId: 'PRJ-IXP', name: 'IXP Sprint 17', startDate: '2026-11-09', endDate: '2026-11-22' });
    expect(created.status).toBe('planned');
    await expect(
      // Members plan their own projects' sprints, not other projects'
      taskService.createSprint(employee, { projectId: 'PRJ-HR', name: 'Mine', startDate: '2026-11-09', endDate: '2026-11-22' }),
    ).rejects.toThrow("can't plan");
    await expect(
      taskService.createSprint(employee, { projectId: 'PRJ-IXP', name: 'IXP Sprint 18', startDate: '2026-11-23', endDate: '2026-12-06' }),
    ).resolves.toMatchObject({ status: 'planned' });
  });
});

describe('taskService Phase 4', () => {
  const hrUser = { id: 'HR001', role: 'hr' as const };
  const employee = { id: 'EMP001', role: 'employee' as const };
  // Karthik Subramanian (EMP007) already has an onboarding checklist in the sample data, so these use Karthik (EMP006)

  it('applies a template as one HR checklist with an owned, dated sub-task per item', async () => {
    const checklist = await taskService.applyTemplate(hrUser, 'TPL-ONBOARDING', 'EMP006', '2026-10-22');
    expect(checklist).toMatchObject({ type: 'hr', title: 'Onboarding: Karthik Subramanian', subjectId: 'EMP006', templateId: 'TPL-ONBOARDING', assigneeId: 'HR001' });
    expect(checklist.key).toMatch(/^HR-\d+$/);

    const items = (await taskService.list(hrUser)).filter((task) => task.parentId === checklist.id);
    expect(items).toHaveLength(10);
    expect(items.every((task) => task.type === 'hr')).toBe(true);
    expect(new Set(items.map((task) => task.assigneeId))).toEqual(new Set(['SYS001', 'HR001', 'PM001', 'EMP006']));

    // The IT owner gets one notification covering both of their items
    const [latest] = await notificationService.list({ id: 'SYS001', role: 'system_admin' });
    expect(latest.title).toBe('2 onboarding tasks for Karthik Subramanian');
  });

  it('turns Admin items into service desk requests that tick their checklist item off when resolved', async () => {
    const desk = { id: 'ADM001', role: 'admin' as const };
    const requests = (await requestService.list(desk)).filter((request) => request.source === 'onboarding' && request.onBehalfOfId === 'EMP006');
    expect(requests.map((request) => request.title).sort()).toEqual([
      'Allocate seating and welcome kit for Karthik Subramanian',
      'Issue ID and access cards for Karthik Subramanian',
      'Issue laptop and accessories for Karthik Subramanian',
    ]);
    expect(requests.every((request) => request.requesterId === 'HR001' && !!request.linkedTaskId)).toBe(true);

    const laptop = requests.find((request) => request.title.startsWith('Issue laptop'))!;
    const linked = () => taskService.list(hrUser).then((tasks) => tasks.find((task) => task.id === laptop.linkedTaskId)!);
    expect((await linked()).description).toContain(laptop.key);
    await requestService.changeStatus(desk, laptop.id, { to: 'resolved' });
    expect((await linked()).status).toBe('done');
  });

  it('refuses a second open checklist from the same template for the same person', async () => {
    await expect(taskService.applyTemplate(hrUser, 'TPL-ONBOARDING', 'EMP006', '2026-10-22')).rejects.toThrow('already has an open');
  });

  it('only lets template managers apply templates', async () => {
    await expect(taskService.applyTemplate(employee, 'TPL-OFFBOARDING', 'EMP002', '2026-11-01')).rejects.toThrow("can't apply");
  });
});

describe('taskService Phase 5', () => {
  const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
  const employee = { id: 'EMP001', role: 'employee' as const };
  const byKey = async (key: string) => (await taskService.list(sysAdmin)).find((task) => task.key === key)!;

  it('creates projects with a unique, valid key; the lead is always a member', async () => {
    const project = await taskService.createProject(sysAdmin, { name: 'Mobile App', key: 'mob', leadId: 'PM001', memberIds: ['EMP002'], defaultIssueType: 'task' });
    expect(project).toMatchObject({ key: 'MOB', memberIds: ['PM001', 'EMP002'] });
    await expect(taskService.createProject(sysAdmin, { name: 'Other', key: 'MOB', leadId: 'PM001', memberIds: [], defaultIssueType: 'task' })).rejects.toThrow('already used');
    await expect(taskService.createProject(sysAdmin, { name: 'Bad', key: '1X', leadId: 'PM001', memberIds: [], defaultIssueType: 'task' })).rejects.toThrow('capital letters');
    await expect(taskService.createProject(employee, { name: 'Mine', key: 'MINE', leadId: 'EMP001', memberIds: [], defaultIssueType: 'task' })).rejects.toThrow("can't create");
  });

  it('updates members without changing the key', async () => {
    const project = (await taskService.listProjects()).find((item) => item.key === 'MOB')!;
    const updated = await taskService.updateProject(sysAdmin, project.id, { name: 'Mobile App', leadId: 'PM001', memberIds: ['EMP003'], defaultIssueType: 'bug' });
    expect(updated).toMatchObject({ key: 'MOB', memberIds: ['PM001', 'EMP003'], defaultIssueType: 'bug' });
  });

  it('bulk-updates what it can and explains what it skipped', async () => {
    const [todo, inReview] = [await byKey('IXP-107'), await byKey('IXP-104')];
    const result = await taskService.bulkUpdate(employee, [todo.id, inReview.id], { kind: 'status', status: 'done' });
    // EMP001 only watches IXP-107 (Arjun's), and IXP-104 needs a manager's approval
    expect(result.updated).toEqual([]);
    expect(result.skipped).toEqual([
      { key: 'IXP-107', reason: "You can't move it to that status" },
      { key: 'IXP-104', reason: 'Needs approval' },
    ]);

    const assigned = await taskService.bulkUpdate(sysAdmin, [todo.id, inReview.id], { kind: 'assign', assigneeId: 'EMP006' });
    expect(assigned.updated).toEqual(['IXP-107', 'IXP-104']);
  });

  it('moves tasks to another project with new keys and keeps the old key for links', async () => {
    const project = (await taskService.listProjects()).find((item) => item.key === 'MOB')!;
    const parent = await byKey('IXP-102'); // has 3 sub-tasks
    const result = await taskService.bulkUpdate(sysAdmin, [parent.id], { kind: 'project', projectId: project.id });
    expect(result.updated).toEqual(['MOB-1']);

    const moved = (await taskService.list(sysAdmin)).filter((task) => task.id === parent.id || task.parentId === parent.id);
    expect(moved.every((task) => task.projectId === project.id && task.key.startsWith('MOB-') && !task.sprintId)).toBe(true);
    expect(moved.find((task) => task.id === parent.id)?.previousKeys).toEqual(['IXP-102']);
  });
});

describe('taskService project access and membership controls', () => {
  const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
  const manager = { id: 'PM001', role: 'project_manager' as const };
  const employee = { id: 'EMP001', role: 'employee' as const };
  const outsider = { id: 'EMP002', role: 'employee' as const };

  it('lets project members open every task of their project, and nobody else', async () => {
    const project = await taskService.createProject(sysAdmin, { name: 'Access Test', key: 'ACC', leadId: 'PM001', memberIds: ['EMP001'], defaultIssueType: 'task' });
    const task = await taskService.create(manager, input({ projectId: project.id, assigneeId: 'PM001', title: 'Lead-only work' }));

    expect((await taskService.list(employee)).some((item) => item.id === task.id)).toBe(true);
    expect((await taskService.list(outsider)).some((item) => item.id === task.id)).toBe(false);
    // Members can join the conversation even on work they aren't part of
    await expect(taskService.addComment(employee, task.id, 'Looks good', [])).resolves.toMatchObject({ body: 'Looks good' });
    await expect(taskService.addComment(outsider, task.id, 'Hi', [])).rejects.toThrow('not found');
  });

  it('keeps adding members with System Admin only', async () => {
    const project = (await taskService.listProjects()).find((item) => item.key === 'ACC')!;
    const asManager = { id: 'PM001', role: 'system_admin' as const };
    // project.manage alone (e.g. granted in Settings) isn't enough to change members
    const notAdmin = { id: 'HR001', role: 'hr' as const };
    await expect(taskService.updateProject(notAdmin, project.id, { name: project.name, leadId: 'PM001', memberIds: [...project.memberIds, 'EMP002'], defaultIssueType: 'task' })).rejects.toThrow();
    await expect(
      taskService.updateProject(asManager, project.id, { name: project.name, leadId: 'PM001', memberIds: project.memberIds, defaultIssueType: 'task', openMembership: false }),
    ).resolves.toMatchObject({ key: 'ACC' });
  });

  it('takes access requests on closed projects and lets a System Admin approve them', async () => {
    const project = (await taskService.listProjects()).find((item) => item.key === 'ACC')!;
    await expect(taskService.joinProject(outsider, project.id)).rejects.toThrow('needs approval');

    const requested = await taskService.requestProjectAccess(outsider, project.id, '/tasks/ACC-1');
    expect(requested.pendingMemberIds).toEqual(['EMP002']);
    await expect(taskService.requestProjectAccess(outsider, project.id)).rejects.toThrow('already asked');
    await expect(taskService.reviewProjectAccess(manager, project.id, 'EMP002', true)).rejects.toThrow('System Admin');

    const approved = await taskService.reviewProjectAccess(sysAdmin, project.id, 'EMP002', true);
    expect(approved.memberIds).toContain('EMP002');
    expect(approved.pendingMemberIds).toEqual([]);
  });

  it('lets anyone join an open project themselves', async () => {
    const open = await taskService.createProject(sysAdmin, { name: 'Open Team', key: 'OPN', leadId: 'PM001', memberIds: [], defaultIssueType: 'task', openMembership: true });
    const joined = await taskService.joinProject(outsider, open.id);
    expect(joined.memberIds).toEqual(['PM001', 'EMP002']);
  });

  it('saves images with a comment, and allows an image-only comment', async () => {
    const task = (await taskService.list(employee)).find((item) => item.assigneeId === 'EMP001' && !item.parentId)!;
    const image = { id: 'img-1', name: 'screenshot.png', url: 'blob:test' };
    const comment = await taskService.addComment(employee, task.id, '', [], [image]);
    expect(comment.attachments).toEqual([image]);
    await expect(taskService.addComment(employee, task.id, '  ', [])).rejects.toThrow('Write a comment or add an image');
  });

  it('edits the reporter and watchers from the task page', async () => {
    const task = (await taskService.list(manager)).find((item) => item.assigneeId === 'EMP001' && !item.parentId)!;
    const rest = toUpdateInput(task);
    const updated = await taskService.update(manager, task.id, { ...rest, reporterId: 'EMP003', watcherIds: ['EMP004'] });
    expect(updated).toMatchObject({ reporterId: 'EMP003', watcherIds: ['EMP004'] });
    await expect(taskService.update(manager, task.id, { ...rest, title: '   ' })).rejects.toThrow('title');
  });
});

describe('taskService project hand-over', () => {
  const employee = { id: 'EMP001', role: 'employee' as const };

  it('lets an employee hand their task to a project teammate, but not to an outsider', async () => {
    const task = (await taskService.list(employee)).find((item) => item.projectId === 'PRJ-IXP' && item.assigneeId === 'EMP001' && !item.parentId && item.type !== 'epic')!;
    await expect(taskService.update(employee, task.id, { ...toUpdateInput(task), assigneeId: 'HR001' })).rejects.toThrow("can't");
    const handed = await taskService.update(employee, task.id, { ...toUpdateInput(task), assigneeId: 'EMP002' });
    expect(handed.assigneeId).toBe('EMP002');
  });
});
