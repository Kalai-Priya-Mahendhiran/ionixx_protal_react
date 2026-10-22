import type { TaskRecord } from '@/components/employee-component/time-tracker/sections/task-form';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleTodaysTasks } from '@/lib/sample-data/time-tracker-sample-data';
import { generateId } from '@/lib/utils';

/*
 * The Time Tracker's daily task log (what someone planned and finished each day, with estimates).
 * In-memory mock (lasts until refresh). GET/POST/PUT/DELETE /api/time-tracker/task-log.
 * Each person only sees their own log; the sample log belongs to the employee demo login.
 */

const MOCK_LATENCY_MS = 120;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

let logs: (TaskRecord & { userId: string })[] = sampleTodaysTasks.map((task) => ({ ...task, userId: 'EMP001' }));

const withoutOwner = ({ userId: _userId, ...task }: TaskRecord & { userId: string }): TaskRecord => task;

export const taskLogService = {
  async list(actor: PermissionUser): Promise<TaskRecord[]> {
    await delay();
    return logs.filter((task) => task.userId === actor.id).map(withoutOwner);
  },

  async create(actor: PermissionUser, tasks: Omit<TaskRecord, 'id'>[]): Promise<TaskRecord[]> {
    await delay();
    const created = tasks.map((task) => ({ ...task, id: generateId(), userId: actor.id }));
    logs = [...created, ...logs];
    return created.map(withoutOwner);
  },

  async update(actor: PermissionUser, id: string, changes: Partial<Omit<TaskRecord, 'id'>>): Promise<void> {
    await delay();
    const existing = logs.find((task) => task.id === id && task.userId === actor.id);
    if (!existing) throw new Error('Task not found');
    logs = logs.map((task) => (task.id === id ? { ...task, ...changes } : task));
  },

  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    logs = logs.filter((task) => !(task.id === id && task.userId === actor.id));
  },
};
