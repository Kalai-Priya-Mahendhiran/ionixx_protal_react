import {
  can,
  canCreateTask,
  canTransition,
  getScope,
  getVisibleTasks,
  type PermissionUser,
  type TaskAction,
} from '@/lib/permissions/task-permissions';
import { sampleProjects, sampleSprints, sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import { generateId } from '@/lib/utils';
import type { EpicSummary, Project, Sprint, Task, TaskActivity, TaskInput, TaskStatus } from '@/types';

/*
 * Task data access. Every method is async and mirrors a REST endpoint (see `endpoints.tasks*`),
 * so the in-memory mock below can be swapped for axios calls without touching components.
 * Mock data lives in module memory: changes last until the page is refreshed.
 *
 * Permission checks here mirror what the backend must enforce on each endpoint.
 */

export class TaskPermissionError extends Error {
  constructor(message = "You don't have permission to do that") {
    super(message);
    this.name = 'TaskPermissionError';
  }
}

const MOCK_LATENCY_MS = 250;

// Shallow copies are enough: the mock replaces task objects instead of mutating them
let tasks: Task[] = sampleTasks.map((task) => ({ ...task }));
const projects: Project[] = sampleProjects.map((project) => ({ ...project }));
const sprints: Sprint[] = sampleSprints.map((sprint) => ({ ...sprint }));
const activities: TaskActivity[] = [];

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const now = () => new Date().toISOString();

function assertCan(actor: PermissionUser, action: TaskAction, task?: Parameters<typeof can>[2], message?: string) {
  if (!can(actor, action, task)) throw new TaskPermissionError(message);
}

function findTask(actor: PermissionUser, id: string): Task {
  const task = tasks.find((item) => item.id === id);
  // Tasks the actor can't see are reported as missing, like a 404 from the API
  if (!task || !can(actor, 'task.view', task)) throw new Error('Task not found');
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
    recordActivity({ taskId: task.id, actorId: actor.id, type: 'created' });
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
    }
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

  // DELETE /api/tasks/:id
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    const existing = findTask(actor, id);
    assertCan(actor, 'task.delete', existing);
    tasks = tasks.filter((task) => task.id !== id);
    recordActivity({ taskId: id, actorId: actor.id, type: 'deleted', from: existing.key });
  },
};
