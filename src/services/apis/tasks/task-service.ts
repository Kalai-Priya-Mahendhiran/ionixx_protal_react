import {
  can,
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
import { generateId } from '@/lib/utils';
import type {
  EpicSummary,
  Project,
  Sprint,
  Task,
  TaskActivity,
  TaskAttachment,
  TaskComment,
  TaskInput,
  TaskStatus,
  WorkLog,
} from '@/types';
import { fileService } from '../files/file-service';
import { notificationService } from '../notifications/notification-service';
import { timeEntryService } from '../time-tracker/time-entry-service';

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

export interface LogWorkInput {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  hours: number;
  note: string;
}

const MOCK_LATENCY_MS = 250;

// Shallow copies are enough: the mock replaces objects instead of mutating them
let tasks: Task[] = sampleTasks.map((task) => ({ ...task }));
const projects: Project[] = sampleProjects.map((project) => ({ ...project }));
const sprints: Sprint[] = sampleSprints.map((sprint) => ({ ...sprint }));
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

function recordActivity(entry: Omit<TaskActivity, 'id' | 'createdAt'>) {
  activities.push({ ...entry, id: generateId(), createdAt: now() });
}

function saveTask(updated: Task): Task {
  tasks = tasks.map((task) => (task.id === updated.id ? updated : task));
  return updated;
}

function notifyAssigned(task: Task, actorId: string) {
  notificationService.notify([task.assigneeId], actorId, {
    type: 'info',
    title: `${task.key} assigned to you`,
    message: `${nameOf(actorId)} assigned you "${task.title}"`,
    actionUrl: taskUrl(task),
  });
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
    return task;
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
    return saveTask(updated);
  },

  // POST /api/tasks/:id/status
  async changeStatus(actor: PermissionUser, id: string, status: TaskStatus): Promise<Task> {
    await delay();
    const existing = findTask(actor, id);
    if (!canTransition(actor, existing, status)) {
      throw new TaskPermissionError("You can't move this task to that status");
    }
    recordActivity({ taskId: id, actorId: actor.id, type: 'status-changed', field: 'status', from: existing.status, to: status });
    return saveTask({ ...existing, status, updatedAt: now() });
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
    recordActivity({ taskId: id, actorId: actor.id, type: blocked ? 'blocked' : 'unblocked', note: blocked ? reason.trim() : undefined });

    // The assignee's manager unblocks; fall back to the reporter when there's no manager on record
    const managerId = getUserById(existing.assigneeId)?.managerId ?? existing.reporterId;
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

    const comment: TaskComment = { id: generateId(), taskId: id, authorId: actor.id, body: body.trim(), mentionIds, createdAt: now() };
    comments = [...comments, comment];
    recordActivity({ taskId: id, actorId: actor.id, type: 'commented' });

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
