import type { TimeTrackerTaskFormRow } from '@/lib/schemas';

export interface TaskRecord extends TimeTrackerTaskFormRow {
  id: string;
  date: string;
}

export const emptyTask: TimeTrackerTaskFormRow = {
  status: 'not-started',
  project: '',
  module: '',
  task: '',
  description: '',
  estimateHours: 1,
  actualHours: undefined,
  completedDate: '',
};

export const getTaskHours = (task: TaskRecord) =>
  task.status === 'completed' ? task.actualHours ?? 0 : task.estimateHours;

export const getDailyHours = (tasks: TaskRecord[]) =>
  tasks.reduce<Record<string, number>>((totals, task) => {
    totals[task.date] = (totals[task.date] ?? 0) + getTaskHours(task);
    return totals;
  }, {});
