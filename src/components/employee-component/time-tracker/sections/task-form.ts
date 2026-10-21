import type { TimeTrackerTaskFormRow } from '@/lib/schemas';
import { toDateInput, todayAsDateInput } from '@/lib/utils';

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

// Show the last 7 days by default
const defaultFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return toDateInput(date);
};

export interface TaskDateRange {
  from: string;
  to: string;
}

export const defaultTaskDateRange = (): TaskDateRange => ({ from: defaultFromDate(), to: todayAsDateInput() });

export const isInTaskDateRange = (task: TaskRecord, range: TaskDateRange) => (!range.from || task.date >= range.from) && (!range.to || task.date <= range.to);
