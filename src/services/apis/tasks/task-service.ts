import {
  can,
  canApprove,
  canManageProjects,
  canMoveToProject,
  canManageSprints,
  canReassign,
  canCreateSubtask,
  canCreateTask,
  canTransition,
  getScope,
  getSubtaskType,
  getVisibleTasks,
  type PermissionUser,
  type TaskAction,
} from '@/lib/permissions/task-permissions';
import {
  sampleActivities,
  sampleComments,
  sampleProjects,
  sampleSprints,
  sampleTasks,
  sampleWorkLogs,
} from '@/lib/sample-data/tasks-sample-data';
import { getUserById } from '@/lib/user-directory';
import { isUserActive } from '@/lib/user-access-store';
import { generateId, toDateInput } from '@/lib/utils';
import type {
  AutomationTrigger,
  EpicSummary,
  Project,
  Sprint,
  Task,
  TaskActivity,
  TaskAttachment,
  TaskComment,
  TaskInput,
  TaskStatus,
  TaskTemplate,
  WorkLog,
} from '@/types';
import { fileService } from '../files/file-service';
import { notificationService } from '../notifications/notification-service';
import { timeEntryService } from '../time-tracker/time-entry-service';
import { auditService } from '../audit/audit-service';
import { automationService } from '../automation/automation-service';
import { getStatusLabel } from '@/lib/workflow';
import { templateService } from '../templates/template-service';
import { planChecklist } from '@/lib/task-templates';
import { onRequestResolved, requestService } from '../service-desk/request-service';
import { getAssetsHeldBy } from '../service-desk/asset-service';

/*
 * Task data access. Every method is async and mirrors a REST endpoint (see `endpoints.tasks*`),
 * so the in-memory mock below can be swapped for axios calls without touching components.
 * Mock data lives in module memory: changes last until the page is refreshed.
 *
 * Permission checks here mirror what the backend must enforce on each endpoint.
 * Notifications and Time Tracker entries are raised here because the server does that in the real system.
 */

export class TaskPermissionError extends Error {
  constructor(message = "You don't have permission to do that") {
    super(message);
    this.name = 'TaskPermissionError';
  }
}

export type ProjectInput = Pick<Project, 'name' | 'key' | 'description' | 'leadId' | 'memberIds' | 'defaultIssueType'>;

// One change applied to many tasks from the list's bulk actions bar
export type BulkChange =
  | { kind: 'assign'; assigneeId: string }
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'project'; projectId: string };

export interface BulkResult {
  updated: string[]; // task keys after the change
  skipped: { key: string; reason: string }[];
}

export const PROJECT_KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export interface LogWorkInput {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  hours: number;
  note: string;
}

const MOCK_LATENCY_MS = 250;

// Shallow copies are enough: the mock replaces objects instead of mutating them
let tasks: Task[] = sampleTasks.map((task) => ({ ...task }));
let projects: Project[] = sampleProjects.map((project) => ({ ...project }));
let sprints: Sprint[] = sampleSprints.map((sprint) => ({ ...sprint }));
const activities: TaskActivity[] = sampleActivities.map((activity) => ({ ...activity }));
let comments: TaskComment[] = sampleComments.map((comment) => ({ ...comment }));
let workLogs: WorkLog[] = sampleWorkLogs.map((workLog) => ({ ...workLog }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const now = () => new Date().toISOString();
const nameOf = (userId: string) => getUserById(userId)?.name ?? 'Someone';
const taskUrl = (task: Task) => `/tasks/${task.key}`;

function assertCan(actor: PermissionUser, action: TaskAction, task?: Parameters<typeof can>[2], message?: string) {
  if (!can(actor, action, task)) throw new TaskPermissionError(message);
}

function findTask(actor: PermissionUser, id: string): Task {
  // Tasks the actor can't see are reported as missing, like a 404 from the API
  const task = getVisibleTasks(actor, tasks).find((item) => item.id === id);
  if (!task) throw new Error('Task not found');
  return task;
}

function findProject(projectId: string): Project {
  const project = projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found');
  return project;
}

// Next key in the project's sequence, e.g. IXP-111 -> IXP-112
function nextTaskKey(project: Project): string {
  const highest = tasks
    .filter((task) => task.projectId === project.id)
    .reduce((max, task) => Math.max(max, Number(task.key.split('-').pop()) || 0), 0);
  return `${project.key}-${highest + 1}`;
}

// Sprints and epics are planning data of a project: visible to its members and to org-wide viewers
function isProjectVisible(actor: PermissionUser, projectId: string): boolean {
  const project = projects.find((item) => item.id === projectId);
  return !!project && (getScope(actor, 'task.view') === 'all' || project.memberIds.includes(actor.id));
}

// The epic and sprint must belong to the task's project; new links can't target a completed sprint
function assertPlanningLinks(task: Pick<Task, 'projectId' | 'type' | 'epicId' | 'sprintId'>, previousSprintId?: string) {
  if (task.epicId) {
    const epic = tasks.find((item) => item.id === task.epicId);
    if (task.type === 'epic') throw new Error("An epic can't belong to another epic");
    if (!epic || epic.type !== 'epic' || epic.projectId !== task.projectId) throw new Error('Choose an epic from the same project');
  }
  if (task.sprintId) {
    const sprint = sprints.find((item) => item.id === task.sprintId);
    if (!sprint || sprint.projectId !== task.projectId) throw new Error('Choose a sprint from the same project');
    if (sprint.status === 'completed' && task.sprintId !== previousSprintId) throw new Error(`${sprint.name} is already completed`);
  }
}

// Plain-text line for the audit log, e.g. "Status: In Progress → In Review"
function auditSummary(entry: Omit<TaskActivity, 'id' | 'createdAt'>): string {
  const suffix = entry.note ? ` (${entry.note})` : '';
  switch (entry.type) {
    case 'created':
      return `Created${suffix}`;
    case 'updated':
      if (entry.field === 'sprint') return `Moved to ${entry.to}`;
      if (entry.field === 'project') return `Moved from ${entry.from} to ${entry.to}`;
      if (entry.field === 'priority') return `Priority: ${entry.from} → ${entry.to}${suffix}`;
      if (entry.field === 'labels') return `Label added: ${entry.to}${suffix}`;
      return 'Details updated';
    case 'status-changed':
      return `Status: ${getStatusLabel(entry.from ?? '')} → ${getStatusLabel(entry.to ?? '')}${suffix}`;
    case 'assigned':
      return `Assignee: ${nameOf(entry.from ?? '')} → ${nameOf(entry.to ?? '')}`;
    case 'duplicated':
      return `Duplicated from ${entry.from}`;
    case 'deleted':
      return 'Deleted';
    case 'commented':
      return 'Comment added';
    case 'subtask-added':
      return `Sub-task ${entry.to} added`;
    case 'attachment-added':
      return `Attached ${entry.note}`;
    case 'attachment-removed':
      return `Removed attachment ${entry.note}`;
    case 'work-logged':
      return `Logged ${entry.to}h`;
    case 'blocked':
      return `Flagged as blocked${suffix}`;
    case 'unblocked':
      return 'Blocked flag removed';
    case 'watched':
      return 'Started watching';
    case 'unwatched':
      return 'Stopped watching';
  }
}

// Task history, mirrored into the audit log
function recordActivity(entry: Omit<TaskActivity, 'id' | 'createdAt'>) {
  const createdAt = now();
  activities.push({ ...entry, id: generateId(), createdAt });
  const key = tasks.find((task) => task.id === entry.taskId)?.key ?? entry.from ?? entry.taskId;
  auditService.record({ at: createdAt, actorId: entry.actorId, entity: 'task', entityKey: key, action: entry.type, summary: auditSummary(entry) });
}

// History from before this session, so the audit log isn't empty on first open
sampleActivities.forEach((activity) =>
  auditService.record({
    at: activity.createdAt,
    actorId: activity.actorId,
    entity: 'task',
    entityKey: sampleTasks.find((task) => task.id === activity.taskId)?.key ?? activity.taskId,
    action: activity.type,
    summary: auditSummary(activity),
  }),
);

/* ---------- Automation ---------- */

const AUTOMATION_ACTOR = 'system';

// Runs the rules that match an event and applies their actions. Actions never trigger further rules.
function runAutomations(trigger: AutomationTrigger, taskId: string, toStatus?: TaskStatus) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;
  automationService.match(trigger, task, toStatus).forEach((rule) => {
    if (trigger === 'due-date-passed' && !automationService.claimOnce(rule, task)) return;
    let current = tasks.find((item) => item.id === taskId)!;
    rule.actions.forEach((action) => {
      if (action.kind === 'notify') {
        const recipients = {
          assignee: [current.assigneeId],
          reporter: [current.reporterId],
          manager: [approverOf(current)],
          watchers: current.watcherIds,
        }[action.recipient];
        notificationService.notify(recipients, AUTOMATION_ACTOR, {
          type: trigger === 'due-date-passed' ? 'warning' : 'info',
          title: `${rule.name}: ${current.key}`,
          message: current.title,
          actionUrl: taskUrl(current),
        });
      } else if (action.kind === 'set-priority' && current.priority !== action.priority) {
        recordActivity({ taskId, actorId: AUTOMATION_ACTOR, type: 'updated', field: 'priority', from: current.priority, to: action.priority, note: rule.name });
        current = saveTask({ ...current, priority: action.priority, updatedAt: now() });
      } else if (action.kind === 'add-label' && !current.labels.includes(action.label)) {
        recordActivity({ taskId, actorId: AUTOMATION_ACTOR, type: 'updated', field: 'labels', to: action.label, note: rule.name });
        current = saveTask({ ...current, labels: [...current.labels, action.label], updatedAt: now() });
      }
    });
    automationService.markRun(rule.id);
    auditService.record({ actorId: AUTOMATION_ACTOR, entity: 'automation', entityKey: rule.name, action: 'ran', summary: `Ran on ${current.key}` });
  });
}

// "Due date passed" rules. The backend runs this on a schedule; the mock checks whenever tasks are listed.
function runDueDateChecks() {
  const today = toDateInput(new Date());
  tasks.filter((task) => task.status !== 'done' && task.dueDate < today).forEach((task) => runAutomations('due-date-passed', task.id));
}

// Every write goes through here, so the completion time stays right whichever path changed the status
// What the Admin team needs to know for a checklist item turned into a request
function adminRequestDescription(kind: TaskTemplate['kind'], itemTitle: string, subjectId: string, dueDate: string): string {
  const subject = getUserById(subjectId);
  const who = subject ? `${subject.name} (${subject.designation}, ${subject.department})` : 'the employee';
  if (kind !== 'offboarding') return `${itemTitle} for ${who}. Needed by ${dueDate}.`;
  const held = getAssetsHeldBy(subjectId);
  const list = held.length ? held.map((asset) => `• ${asset.tag}: ${asset.model}`).join('\n') : '• No assets are recorded against them in the asset log.';
  return `${itemTitle} from ${who} by ${dueDate}.\n\nCurrently issued to them:\n${list}`;
}

// A resolved Admin request ticks off the checklist item it was created for
onRequestResolved((request) => {
  const task = request.linkedTaskId ? tasks.find((item) => item.id === request.linkedTaskId) : undefined;
  if (!task || task.status === 'done') return;
  saveTask({ ...task, status: 'done', updatedAt: now() });
  recordActivity({ taskId: task.id, actorId: 'system', type: 'status-changed', field: 'status', from: task.status, to: 'done', note: `${request.key} was resolved` });
});

function saveTask(updated: Task): Task {
  const previous = tasks.find((task) => task.id === updated.id);
  const finished = updated.status === 'done';
  const saved: Task = {
    ...updated,
    completedAt: finished ? (previous?.status === 'done' ? (previous.completedAt ?? updated.completedAt) : now()) : undefined,
  };
  tasks = tasks.map((task) => (task.id === saved.id ? saved : task));
  return saved;
}

function notifyAssigned(task: Task, actorId: string) {
  notificationService.notify([task.assigneeId], actorId, {
    type: 'info',
    title: `${task.key} assigned to you`,
    message: `${nameOf(actorId)} assigned you "${task.title}"`,
    actionUrl: taskUrl(task),
  });
}

// The person who unblocks and approves: the assignee's manager, else the reporter
function approverOf(task: Task): string {
  return getUserById(task.assigneeId)?.managerId ?? task.reporterId;
}

// Saves a comment and tells mentioned people and everyone following the task
function postComment(actor: PermissionUser, task: Task, body: string, mentionIds: string[]): TaskComment {
  const comment: TaskComment = { id: generateId(), taskId: task.id, authorId: actor.id, body: body.trim(), mentionIds, createdAt: now() };
  comments = [...comments, comment];
  recordActivity({ taskId: task.id, actorId: actor.id, type: 'commented' });

  const excerpt = comment.body.length > 120 ? `${comment.body.slice(0, 117)}…` : comment.body;
  notificationService.notify(mentionIds, actor.id, {
    type: 'info',
    title: `${nameOf(actor.id)} mentioned you on ${task.key}`,
    message: excerpt,
    actionUrl: taskUrl(task),
  });
  // Everyone else involved hears about the comment, once
  const followers = [task.assigneeId, task.reporterId, ...task.watcherIds].filter((userId) => !mentionIds.includes(userId));
  notificationService.notify(followers, actor.id, {
    type: 'info',
    title: `New comment on ${task.key}`,
    message: `${nameOf(actor.id)}: ${excerpt}`,
    actionUrl: taskUrl(task),
  });
  return comment;
}

function findSprint(sprintId: string): Sprint {
  const sprint = sprints.find((item) => item.id === sprintId);
  if (!sprint) throw new Error('Sprint not found');
  return sprint;
}

function assertCanPlan(actor: PermissionUser, projectId: string) {
  if (!canManageSprints(actor, findProject(projectId))) throw new TaskPermissionError("You can't plan sprints for this project");
}

// Moves a task and its sub-tasks together
function setSprint(task: Task, sprintId: string | undefined) {
  tasks = tasks.map((item) => (item.id === task.id || item.parentId === task.id ? { ...item, sprintId, updatedAt: now() } : item));
}

// "HH:MM" plus a number of hours, e.g. 09:30 + 1.5 -> 11:00
function addHours(startTime: string, hours: number): string {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + Math.round(hours * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export const taskService = {
  // GET /api/tasks — the server returns only tasks the caller may view
  async list(actor: PermissionUser): Promise<Task[]> {
    await delay();
    runDueDateChecks();
    return getVisibleTasks(actor, tasks);
  },

  // GET /api/projects
  async listProjects(): Promise<Project[]> {
    await delay();
    return projects;
  },

  // GET /api/sprints — sprints of projects the caller can plan in
  async listSprints(actor: PermissionUser): Promise<Sprint[]> {
    await delay();
    return sprints.filter((sprint) => isProjectVisible(actor, sprint.projectId));
  },

  // GET /api/epics — epic summaries, so members can link work to an epic they aren't assigned to
  async listEpics(actor: PermissionUser): Promise<EpicSummary[]> {
    await delay();
    return tasks
      .filter((task) => task.type === 'epic' && isProjectVisible(actor, task.projectId))
      .map(({ id, key, title, projectId }) => ({ id, key, title, projectId }));
  },

  // POST /api/tasks
  async create(actor: PermissionUser, input: TaskInput): Promise<Task> {
    await delay();
    if (!canCreateTask(actor, input)) {
      throw new TaskPermissionError("You can't create this task for the selected assignee or type");
    }
    assertPlanningLinks(input);

    const timestamp = now();
    const task: Task = {
      ...input,
      reporterId: actor.id,
      id: generateId(),
      key: nextTaskKey(findProject(input.projectId)),
      status: 'todo',
      watcherIds: [],
      loggedHours: 0,
      isBlocked: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tasks = [task, ...tasks];
    // Files uploaded in the Create dialog existed before the task did
    await fileService.linkToTask(input.attachments.flatMap((attachment) => attachment.fileId ?? []), task.id);
    recordActivity({ taskId: task.id, actorId: actor.id, type: 'created' });
    notifyAssigned(task, actor.id);
    runAutomations('task-created', task.id);
    return tasks.find((item) => item.id === task.id) ?? task;
  },

  // PATCH /api/tasks/:id — project changes are not supported here (task keys belong to a project)
  async update(actor: PermissionUser, id: string, input: Omit<TaskInput, 'projectId'>): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.edit', existing);

    const updated: Task = { ...existing, ...input, updatedAt: now() };
    assertCan(actor, 'task.edit', updated, "You can't save this task with the selected type or assignee");
    assertPlanningLinks(updated, existing.sprintId);
    if (updated.assigneeId !== existing.assigneeId) {
      assertCan(actor, 'task.assign', updated, "You can't assign tasks to this person");
      recordActivity({ taskId: id, actorId: actor.id, type: 'assigned', from: existing.assigneeId, to: updated.assigneeId });
      notifyAssigned(updated, actor.id);
    }
    await fileService.linkToTask(input.attachments.flatMap((attachment) => attachment.fileId ?? []), id);
    recordActivity({ taskId: id, actorId: actor.id, type: 'updated' });
    saveTask(updated);
    if (updated.assigneeId !== existing.assigneeId) runAutomations('assigned', id);
    return tasks.find((item) => item.id === id) ?? updated;
  },

  // POST /api/tasks/:id/status
  async changeStatus(actor: PermissionUser, id: string, status: TaskStatus): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    if (!canTransition(actor, existing, status)) {
      throw new TaskPermissionError("You can't move this task to that status");
    }
    recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: existing.status, to: status });
    // Work ready for review goes to the approver's "Awaiting my approval" list
    if (status === 'in-review' && !existing.parentId) {
      notificationService.notify([approverOf(existing)], actor.id, {
        type: 'info',
        title: `${existing.key} is ready for your review`,
        message: `${nameOf(actor.id)} moved "${existing.title}" to In Review`,
        actionUrl: taskUrl(existing),
      });
    }
    saveTask({ ...existing, status, updatedAt: now() });
    runAutomations('status-changed', id, status);
    return tasks.find((item) => item.id === id)!;
  },

  /* ---------- Approvals ---------- */

  // POST /api/tasks/:id/approve — In Review -> Done
  async approve(actor: PermissionUser, id: string): Promise<Task> {
    await delay();
    const task = findTask(actor, id);
    if (!canApprove(actor, task)) throw new TaskPermissionError("You can't approve this task");
    recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: task.status, to: 'done', note: 'Approved' });
    notificationService.notify([task.assigneeId], actor.id, {
      type: 'success',
      title: `${task.key} approved`,
      message: `${nameOf(actor.id)} approved "${task.title}" and moved it to Done`,
      actionUrl: taskUrl(task),
    });
    saveTask({ ...task, status: 'done', updatedAt: now() });
    runAutomations('status-changed', id, 'done');
    return tasks.find((item) => item.id === id)!;
  },

  // POST /api/tasks/:id/send-back { comment } — In Review -> In Progress, with the reason posted as a comment
  async sendBack(actor: PermissionUser, id: string, reason: string): Promise<Task> {
    await delay();
    const task = findTask(actor, id);
    if (!canApprove(actor, task)) throw new TaskPermissionError("You can't review this task");
    if (reason.trim().length < 5) throw new Error('Explain what needs to change (at least 5 characters)');

    recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: task.status, to: 'in-progress', note: 'Sent back' });
    postComment(actor, task, `Sent back for changes: ${reason.trim()}`, []);
    notificationService.notify([task.assigneeId], actor.id, {
      type: 'warning',
      title: `${task.key} needs changes`,
      message: `${nameOf(actor.id)}: ${reason.trim()}`,
      actionUrl: taskUrl(task),
    });
    saveTask({ ...task, status: 'in-progress', updatedAt: now() });
    runAutomations('status-changed', id, 'in-progress');
    return tasks.find((item) => item.id === id)!;
  },

  /* ---------- Reassign (team board swimlanes) ---------- */

  // PATCH /api/tasks/:id { assigneeId, status? }
  async reassign(actor: PermissionUser, id: string, assigneeId: string, status?: TaskStatus): Promise<Task> {
    await delay();
    const task = findTask(actor, id);
    if (!canReassign(actor, task, assigneeId)) throw new TaskPermissionError(`You can't assign ${task.key} to ${nameOf(assigneeId)}`);
    const nextStatus = status && status !== task.status ? status : task.status;
    if (nextStatus !== task.status && !canTransition(actor, task, nextStatus)) {
      throw new TaskPermissionError("You can't move this task to that status");
    }

    recordActivity({ taskId: id, actorId: actor.id, type: 'assigned', from: task.assigneeId, to: assigneeId });
    if (nextStatus !== task.status) {
      recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: task.status, to: nextStatus });
    }
    const updated = saveTask({ ...task, assigneeId, status: nextStatus, updatedAt: now() });
    notifyAssigned(updated, actor.id);
    runAutomations('assigned', id);
    if (nextStatus !== task.status) runAutomations('status-changed', id, nextStatus);
    return tasks.find((item) => item.id === id) ?? updated;
  },

  /* ---------- Sprints ---------- */

  // POST /api/sprints
  async createSprint(actor: PermissionUser, input: Pick<Sprint, 'projectId' | 'name' | 'goal' | 'startDate' | 'endDate'>): Promise<Sprint> {
    await delay();
    assertCanPlan(actor, input.projectId);
    if (!input.name.trim()) throw new Error('Give the sprint a name');
    if (input.endDate <= input.startDate) throw new Error('The sprint must end after it starts');
    if (sprints.some((sprint) => sprint.projectId === input.projectId && sprint.name.toLowerCase() === input.name.trim().toLowerCase())) {
      throw new Error(`${input.name.trim()} already exists`);
    }
    const sprint: Sprint = { ...input, name: input.name.trim(), goal: input.goal?.trim() || undefined, id: generateId(), status: 'planned' };
    sprints = [...sprints, sprint];
    return sprint;
  },

  // POST /api/sprints/:id/start — one active sprint per project
  async startSprint(actor: PermissionUser, sprintId: string): Promise<Sprint> {
    await delay();
    const sprint = findSprint(sprintId);
    assertCanPlan(actor, sprint.projectId);
    if (sprint.status !== 'planned') throw new Error(`${sprint.name} has already started`);
    const running = sprints.find((item) => item.projectId === sprint.projectId && item.status === 'active');
    if (running) throw new Error(`Complete ${running.name} before starting another sprint`);

    const started: Sprint = { ...sprint, status: 'active' };
    sprints = sprints.map((item) => (item.id === sprintId ? started : item));
    return started;
  },

  // POST /api/sprints/:id/complete { moveTo } — unfinished work goes to a planned sprint or the backlog
  async completeSprint(actor: PermissionUser, sprintId: string, moveToSprintId: string | null): Promise<{ sprint: Sprint; moved: number }> {
    await delay();
    const sprint = findSprint(sprintId);
    assertCanPlan(actor, sprint.projectId);
    if (sprint.status !== 'active') throw new Error(`${sprint.name} isn't running`);
    if (moveToSprintId) {
      const target = findSprint(moveToSprintId);
      if (target.projectId !== sprint.projectId || target.status !== 'planned') throw new Error('Move unfinished work to a planned sprint of the same project');
    }

    const unfinished = tasks.filter((task) => task.sprintId === sprintId && task.status !== 'done');
    tasks = tasks.map((task) => (unfinished.includes(task) ? { ...task, sprintId: moveToSprintId ?? undefined, updatedAt: now() } : task));
    const completed: Sprint = { ...sprint, status: 'completed' };
    sprints = sprints.map((item) => (item.id === sprintId ? completed : item));
    return { sprint: completed, moved: unfinished.filter((task) => !task.parentId).length };
  },

  // PATCH /api/tasks/:id { sprintId } — null moves the task to the backlog
  async moveToSprint(actor: PermissionUser, id: string, sprintId: string | null): Promise<Task> {
    await delay();
    const task = findTask(actor, id);
    assertCanPlan(actor, task.projectId);
    if (task.parentId) throw new Error('Sub-tasks move with their parent task');
    if (sprintId) {
      const sprint = findSprint(sprintId);
      if (sprint.projectId !== task.projectId) throw new Error('Choose a sprint from the same project');
      if (sprint.status === 'completed') throw new Error(`${sprint.name} is already completed`);
    }
    setSprint(task, sprintId ?? undefined);
    recordActivity({ taskId: id, actorId: actor.id, type: 'updated', field: 'sprint', to: sprintId ? findSprint(sprintId).name : 'the backlog' });
    return findTask(actor, id);
  },

  // POST /api/tasks/:id/duplicate
  async duplicate(actor: PermissionUser, id: string): Promise<Task> {
    const source = findTask(actor, id);
    const copy = await taskService.create(actor, {
      projectId: source.projectId,
      type: source.type,
      title: `Copy of ${source.title}`,
      description: source.description,
      priority: source.priority,
      assigneeId: source.assigneeId,
      startDate: source.startDate,
      dueDate: source.dueDate,
      labels: [...source.labels],
      epicId: source.epicId,
      // A copy of finished-sprint work goes back to the backlog
      sprintId: sprints.find((sprint) => sprint.id === source.sprintId)?.status === 'completed' ? undefined : source.sprintId,
      estimateHours: source.estimateHours,
      attachments: [],
    });
    recordActivity({ taskId: copy.id, actorId: actor.id, type: 'duplicated', from: source.key });
    return copy;
  },

  // DELETE /api/tasks/:id — sub-tasks go with their parent
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.delete', existing);
    tasks = tasks.filter((task) => task.id !== id && task.parentId !== id);
    recordActivity({ taskId: id, actorId: actor.id, type: 'deleted', from: existing.key });
  },

  /* ---------- Projects ---------- */

  // POST /api/projects — the key drives task keys (IXP -> IXP-1) and can't change later
  async createProject(actor: PermissionUser, input: ProjectInput): Promise<Project> {
    await delay();
    if (!canManageProjects(actor)) throw new TaskPermissionError("You can't create projects");
    const key = input.key.trim().toUpperCase();
    const name = input.name.trim();
    if (!name) throw new Error('Give the project a name');
    if (!PROJECT_KEY_PATTERN.test(key)) throw new Error('Keys are 2–10 capital letters or digits, starting with a letter (e.g. IXP)');
    if (projects.some((project) => project.key === key)) throw new Error(`The key ${key} is already used`);
    if (projects.some((project) => project.name.toLowerCase() === name.toLowerCase())) throw new Error(`A project called "${name}" already exists`);
    if (!getUserById(input.leadId)) throw new Error('Choose a project lead');
    if ([input.leadId, ...input.memberIds].some((memberId) => !isUserActive(memberId))) throw new Error("Deactivated accounts can't be added to a project");

    const project: Project = {
      ...input,
      id: generateId(),
      key,
      name,
      description: input.description?.trim() || undefined,
      // The lead is always a member
      memberIds: [...new Set([input.leadId, ...input.memberIds])],
    };
    projects = [...projects, project];
    auditService.record({ actorId: actor.id, entity: 'project', entityKey: project.key, action: 'created', summary: `Project "${project.name}" created` });
    return project;
  },

  // PATCH /api/projects/:id — name, lead, members and default type; the key stays
  async updateProject(actor: PermissionUser, id: string, input: Omit<ProjectInput, 'key'>): Promise<Project> {
    await delay();
    if (!canManageProjects(actor)) throw new TaskPermissionError("You can't edit projects");
    const existing = findProject(id);
    const name = input.name.trim();
    if (!name) throw new Error('Give the project a name');
    if (projects.some((project) => project.id !== id && project.name.toLowerCase() === name.toLowerCase())) {
      throw new Error(`A project called "${name}" already exists`);
    }
    if (!getUserById(input.leadId)) throw new Error('Choose a project lead');
    // Deactivated people already on the project may stay (for history); nobody inactive can be added or made lead
    const newPeople = [input.leadId, ...input.memberIds].filter((memberId) => !existing.memberIds.includes(memberId) || memberId === input.leadId);
    if (newPeople.some((memberId) => !isUserActive(memberId))) throw new Error("Deactivated accounts can't lead or join a project");
    const updated: Project = {
      ...existing,
      ...input,
      name,
      description: input.description?.trim() || undefined,
      memberIds: [...new Set([input.leadId, ...input.memberIds])],
    };
    projects = projects.map((project) => (project.id === id ? updated : project));
    const added = updated.memberIds.filter((memberId) => !existing.memberIds.includes(memberId)).map(nameOf);
    const removed = existing.memberIds.filter((memberId) => !updated.memberIds.includes(memberId)).map(nameOf);
    const memberChanges = [added.length ? `added ${added.join(', ')}` : '', removed.length ? `removed ${removed.join(', ')}` : ''].filter(Boolean).join('; ');
    auditService.record({ actorId: actor.id, entity: 'project', entityKey: updated.key, action: 'updated', summary: memberChanges ? `Members: ${memberChanges}` : 'Project details updated' });
    return updated;
  },

  /* ---------- Labels (Settings) ---------- */

  // POST /api/task-settings/labels/:name/rename { to } and DELETE /api/task-settings/labels/:name
  // Applies a label rename (or removal, when `to` is null) to every task, not only the ones the admin can see
  async relabelTasks(actor: PermissionUser, from: string, to: string | null): Promise<number> {
    await delay();
    if (!can(actor, 'workflow.configure')) throw new TaskPermissionError("You can't change labels");
    let changed = 0;
    tasks = tasks.map((task) => {
      if (!task.labels.includes(from)) return task;
      changed += 1;
      const labels = to ? [...new Set(task.labels.map((label) => (label === from ? to : label)))] : task.labels.filter((label) => label !== from);
      return { ...task, labels };
    });
    auditService.record({
      actorId: actor.id,
      entity: 'settings',
      entityKey: 'Labels',
      action: to ? 'renamed' : 'deleted',
      summary: to ? `Label "${from}" renamed to "${to}" on ${changed} tasks` : `Label "${from}" removed from ${changed} tasks`,
    });
    return changed;
  },

  /* ---------- Bulk actions ---------- */

  // POST /api/tasks/bulk { ids, change } — every task is checked on its own; the rest are skipped with a reason
  async bulkUpdate(actor: PermissionUser, ids: string[], change: BulkChange): Promise<BulkResult> {
    await delay();
    const result: BulkResult = { updated: [], skipped: [] };
    const assignedCount = new Map<string, number>();
    const target = change.kind === 'project' ? projects.find((project) => project.id === change.projectId) : undefined;
    if (change.kind === 'project' && !target) throw new Error('Choose a project');

    ids.forEach((id) => {
      const task = getVisibleTasks(actor, tasks).find((item) => item.id === id);
      if (!task) return;
      const skip = (reason: string) => result.skipped.push({ key: task.key, reason });

      if (change.kind === 'assign') {
        if (task.assigneeId === change.assigneeId) return skip('Already assigned to them');
        if (!canReassign(actor, task, change.assigneeId)) return skip(`You can't assign it to ${nameOf(change.assigneeId)}`);
        recordActivity({ taskId: id, actorId: actor.id, type: 'assigned', from: task.assigneeId, to: change.assigneeId });
        saveTask({ ...task, assigneeId: change.assigneeId, updatedAt: now() });
        runAutomations('assigned', task.id);
        assignedCount.set(change.assigneeId, (assignedCount.get(change.assigneeId) ?? 0) + 1);
        result.updated.push(task.key);
        return;
      }

      if (change.kind === 'status') {
        if (task.status === change.status) return skip('Already in that status');
        if (!canTransition(actor, task, change.status)) {
          return skip(task.status === 'in-review' && change.status === 'done' ? 'Needs approval' : "You can't move it to that status");
        }
        recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: task.status, to: change.status });
        saveTask({ ...task, status: change.status, updatedAt: now() });
        runAutomations('status-changed', task.id, change.status);
        result.updated.push(task.key);
        return;
      }

      // Move to another project: the task (and its sub-tasks) get keys in the new project
      if (task.projectId === target!.id) return skip('Already in that project');
      if (!canMoveToProject(actor, task, target!.id)) return skip("You can't move it");
      const family = [task, ...tasks.filter((item) => item.parentId === task.id)];
      family.forEach((member) => {
        const moved: Task = {
          ...member,
          projectId: target!.id,
          key: nextTaskKey(target!),
          previousKeys: [...(member.previousKeys ?? []), member.key],
          // Sprints and epics belong to the old project
          sprintId: undefined,
          epicId: undefined,
          updatedAt: now(),
        };
        saveTask(moved);
        recordActivity({ taskId: member.id, actorId: actor.id, type: 'updated', field: 'project', from: member.key, to: moved.key });
        if (member.id === task.id) result.updated.push(moved.key);
      });
    });

    // One notification per new assignee
    assignedCount.forEach((count, assigneeId) =>
      notificationService.notify([assigneeId], actor.id, {
        type: 'info',
        title: `${count} ${count === 1 ? 'task' : 'tasks'} assigned to you`,
        message: `${nameOf(actor.id)} assigned you work from the task list`,
        actionUrl: '/tasks?view=my-tasks',
      }),
    );
    return result;
  },

  /* ---------- HR checklists from templates ---------- */

  // POST /api/task-templates/:id/apply { subjectId, anchorDate }
  // Creates one HR parent task (the checklist) with each template item as a sub-task
  async applyTemplate(actor: PermissionUser, templateId: string, subjectId: string, anchorDate: string): Promise<Task> {
    await delay();
    if (!can(actor, 'template.manage')) throw new TaskPermissionError("You can't apply templates");
    const template = templateService.get(templateId);
    const subject = getUserById(subjectId);
    if (!subject) throw new Error('Choose the employee this checklist is for');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorDate)) throw new Error('Choose a valid date');
    const project = projects.find((item) => item.defaultIssueType === 'hr');
    if (!project) throw new Error('There is no HR project to create the checklist in');
    // A second open checklist from the same template for the same person would duplicate work
    if (tasks.some((task) => !task.parentId && task.templateId === templateId && task.subjectId === subjectId && task.status !== 'done')) {
      throw new Error(`${subject.name} already has an open "${template.name}" checklist`);
    }

    const plan = planChecklist(template, subjectId, anchorDate, actor);
    plan.items.forEach(({ item, assigneeId }) => {
      if (!canCreateTask(actor, { assigneeId, type: 'hr' })) throw new TaskPermissionError(`You can't assign "${item.title}" to ${nameOf(assigneeId)}`);
    });

    const timestamp = now();
    const base = { projectId: project.id, type: 'hr' as const, reporterId: actor.id, watcherIds: [], labels: [template.kind], loggedHours: 0, isBlocked: false, attachments: [], templateId, subjectId, createdAt: timestamp, updatedAt: timestamp };
    const parent: Task = {
      ...base,
      id: generateId(),
      key: nextTaskKey(project),
      title: plan.title,
      description: template.description ?? '',
      status: 'todo',
      priority: 'high',
      assigneeId: actor.id,
      startDate: plan.startDate,
      dueDate: plan.dueDate,
      estimateHours: plan.estimateHours,
    };
    tasks = [parent, ...tasks];
    plan.items.forEach(({ item, assigneeId, dueDate }) => {
      const subtask: Task = {
        ...base,
        id: generateId(),
        key: nextTaskKey(project),
        title: item.title,
        description: item.description ?? '',
        status: 'todo',
        priority: item.priority,
        assigneeId,
        dueDate,
        estimateHours: item.estimateHours,
        parentId: parent.id,
      };
      tasks = [...tasks, subtask];
      // Admin items are worked in the service desk; the sub-task tracks the request and ticks itself off when it's resolved
      if (item.owner === 'admin') {
        const request = requestService.createLinked(actor, {
          category: item.requestCategory ?? 'other',
          title: `${item.title} for ${subject.name}`,
          description: adminRequestDescription(template.kind, item.title, subjectId, dueDate),
          priority: item.priority,
          onBehalfOfId: subjectId,
          source: template.kind === 'custom' ? 'checklist' : template.kind,
          linkedTaskId: subtask.id,
        });
        tasks = tasks.map((task) => (task.id === subtask.id ? { ...task, description: `Handled by the Admin team in ${request.key}. Ticked off automatically when the request is resolved.` } : task));
      }
    });
    recordActivity({ taskId: parent.id, actorId: actor.id, type: 'created', note: `from the "${template.name}" template` });

    // One notification per owner rather than one per item
    const countByOwner = new Map<string, number>();
    plan.items.forEach(({ assigneeId }) => countByOwner.set(assigneeId, (countByOwner.get(assigneeId) ?? 0) + 1));
    countByOwner.forEach((count, ownerId) =>
      notificationService.notify([ownerId], actor.id, {
        type: 'info',
        title: `${count} ${template.kind === 'custom' ? 'checklist' : template.kind} ${count === 1 ? 'task' : 'tasks'} for ${subject.name}`,
        message: `${nameOf(actor.id)} assigned you items on "${plan.title}"`,
        actionUrl: taskUrl(parent),
      }),
    );
    runAutomations('task-created', parent.id);
    return parent;
  },

  /* ---------- Sub-tasks ---------- */

  // POST /api/tasks/:id/subtasks — inherits project, sprint, priority and due date from the parent
  async createSubtask(actor: PermissionUser, parentId: string, input: { title: string; assigneeId: string }): Promise<Task> {
    await delay();
    const parent = findTask(actor, parentId);
    if (parent.parentId) throw new Error("Sub-tasks can't have their own sub-tasks");
    if (!canCreateSubtask(actor, parent, input.assigneeId)) {
      throw new TaskPermissionError("You can't add a sub-task for this person");
    }

    const timestamp = now();
    const subtask: Task = {
      id: generateId(),
      key: nextTaskKey(findProject(parent.projectId)),
      projectId: parent.projectId,
      type: getSubtaskType(parent),
      title: input.title.trim(),
      description: '',
      status: 'todo',
      priority: parent.priority,
      assigneeId: input.assigneeId,
      reporterId: actor.id,
      watcherIds: [],
      labels: [],
      dueDate: parent.dueDate,
      loggedHours: 0,
      parentId: parent.id,
      sprintId: parent.sprintId,
      isBlocked: false,
      attachments: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tasks = [...tasks, subtask];
    recordActivity({ taskId: parent.id, actorId: actor.id, type: 'subtask-added', to: subtask.key, note: subtask.title });
    notifyAssigned(subtask, actor.id);
    return subtask;
  },

  /* ---------- Watching ---------- */

  // PUT / DELETE /api/tasks/:id/watchers/me
  async setWatching(actor: PermissionUser, id: string, watching: boolean): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    // Anyone can stop watching; starting needs watch rights
    if (watching) assertCan(actor, 'task.watch', existing, "You can't watch this task");
    const watcherIds = watching
      ? [...new Set([...existing.watcherIds, actor.id])]
      : existing.watcherIds.filter((watcherId) => watcherId !== actor.id);
    recordActivity({ taskId: id, actorId: actor.id, type: watching ? 'watched' : 'unwatched' });
    return saveTask({ ...existing, watcherIds });
  },

  /* ---------- Blocked flag ---------- */

  // POST /api/tasks/:id/block { reason } · DELETE /api/tasks/:id/block
  async setBlocked(actor: PermissionUser, id: string, blocked: boolean, reason = ''): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.changeStatus', existing, "You can't flag this task");
    if (blocked && !reason.trim()) throw new Error('Add a reason so your manager knows how to help');

    const updated = saveTask({ ...existing, isBlocked: blocked, blockedReason: blocked ? reason.trim() : undefined, updatedAt: now() });
    if (blocked) runAutomations('blocked', id);
    recordActivity({ taskId: id, actorId: actor.id, type: blocked ? 'blocked' : 'unblocked', note: blocked ? reason.trim() : undefined });

    // The assignee's manager unblocks (or the reporter when there's no manager on record)
    const managerId = approverOf(existing);
    notificationService.notify([managerId], actor.id, {
      type: blocked ? 'warning' : 'success',
      title: blocked ? `${existing.key} is blocked` : `${existing.key} is unblocked`,
      message: blocked ? `${nameOf(actor.id)} needs help: ${reason.trim()}` : `${nameOf(actor.id)} removed the blocked flag`,
      actionUrl: taskUrl(existing),
    });
    return updated;
  },

  /* ---------- Attachments ---------- */

  // POST /api/tasks/:id/attachments — files are uploaded to the Files module first
  async addAttachments(actor: PermissionUser, id: string, attachments: TaskAttachment[]): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.edit', existing, "You can't add attachments to this task");
    await fileService.linkToTask(attachments.flatMap((attachment) => attachment.fileId ?? []), id);
    attachments.forEach((attachment) =>
      recordActivity({ taskId: id, actorId: actor.id, type: 'attachment-added', note: attachment.name }),
    );
    return saveTask({ ...existing, attachments: [...existing.attachments, ...attachments], updatedAt: now() });
  },

  // DELETE /api/tasks/:id/attachments/:attachmentId — the file itself stays in the Files module
  async removeAttachment(actor: PermissionUser, id: string, attachmentId: string): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.edit', existing, "You can't remove attachments from this task");
    const removed = existing.attachments.find((attachment) => attachment.id === attachmentId);
    recordActivity({ taskId: id, actorId: actor.id, type: 'attachment-removed', note: removed?.name });
    return saveTask({ ...existing, attachments: existing.attachments.filter((attachment) => attachment.id !== attachmentId) });
  },

  /* ---------- Comments ---------- */

  // GET /api/tasks/:id/comments — oldest first, like a conversation
  async listComments(actor: PermissionUser, id: string): Promise<TaskComment[]> {
    await delay();
    findTask(actor, id);
    return comments.filter((comment) => comment.taskId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  // POST /api/tasks/:id/comments
  async addComment(actor: PermissionUser, id: string, body: string, mentionIds: string[]): Promise<TaskComment> {
    await delay();
    const task = findTask(actor, id);
    assertCan(actor, 'task.comment', task, "You can't comment on this task");
    if (!body.trim()) throw new Error('Write a comment first');
    return postComment(actor, task, body, mentionIds);
  },

  /* ---------- History & work log ---------- */

  // GET /api/tasks/:id/activity — newest first
  async listActivity(actor: PermissionUser, id: string): Promise<TaskActivity[]> {
    await delay();
    findTask(actor, id);
    return activities.filter((activity) => activity.taskId === id).sort(byNewest);
  },

  // GET /api/tasks/:id/worklogs — newest first
  async listWorkLogs(actor: PermissionUser, id: string): Promise<WorkLog[]> {
    await delay();
    findTask(actor, id);
    return workLogs.filter((workLog) => workLog.taskId === id).sort(byNewest);
  },

  // POST /api/tasks/:id/worklogs — also files the hours in the Time Tracker
  async logWork(actor: PermissionUser, id: string, input: LogWorkInput): Promise<WorkLog> {
    await delay();
    const task = findTask(actor, id);
    assertCan(actor, 'task.logWork', task, "You can't log work on this task");
    if (!(input.hours > 0)) throw new Error('Enter the hours you worked');

    const workLog: WorkLog = { id: generateId(), taskId: id, userId: actor.id, ...input, note: input.note.trim(), createdAt: now() };
    workLogs = [...workLogs, workLog];
    saveTask({ ...task, loggedHours: Math.round((task.loggedHours + input.hours) * 100) / 100, updatedAt: now() });
    recordActivity({ taskId: id, actorId: actor.id, type: 'work-logged', to: String(input.hours), note: workLog.note || undefined });

    await timeEntryService.create(actor, {
      project: findProject(task.projectId).name,
      task: `${task.key}: ${task.title}`,
      date: input.date,
      startTime: input.startTime,
      endTime: addHours(input.startTime, input.hours),
      totalHours: input.hours,
      description: workLog.note || `Work on ${task.key}`,
      taskId: id,
    });
    return workLog;
  },
};
