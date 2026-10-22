import type { TaskRecord } from '@/components/employee-component/time-tracker/sections/task-form';
import type { WeeklyTimeDistribution } from '@/components/employee-component/time-tracker/sections/weekly-time-chart-section';
import { toDateInput } from '@/lib/utils';
import type { TimeEntry } from '@/types';

/*
 * Time Tracker figures worked out from the person's own data (no fixed numbers).
 */

// Colours for projects in order of hours; more projects than colours reuse the last one
const PROJECT_COLOURS = [
  { bgColor: 'bg-blue-50', dotColor: 'bg-blue-500' },
  { bgColor: 'bg-teal-50', dotColor: 'bg-teal-500' },
  { bgColor: 'bg-purple-50', dotColor: 'bg-purple-500' },
  { bgColor: 'bg-amber-50', dotColor: 'bg-amber-500' },
  { bgColor: 'bg-gray-50', dotColor: 'bg-gray-400' },
];

// Monday of the week containing `date`
export function weekStartOf(date = new Date()): string {
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return toDateInput(monday);
}

// Hours per project this week, biggest first
export function weeklyDistribution(entries: TimeEntry[], today: string): WeeklyTimeDistribution[] {
  const from = weekStartOf(new Date(`${today}T00:00:00`));
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.date < from || entry.date > today) continue;
    totals.set(entry.project, (totals.get(entry.project) ?? 0) + entry.totalHours);
  }
  const all = [...totals.values()].reduce((sum, hours) => sum + hours, 0);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([project, hours], index) => ({ project, hours, percentage: all ? Math.round((hours / all) * 100) : 0, ...PROJECT_COLOURS[Math.min(index, PROJECT_COLOURS.length - 1)] }));
}

// Share of planned tasks finished (tasks on hold don't count against you)
export function productivity(tasks: TaskRecord[]): number {
  const counted = tasks.filter((task) => task.status !== 'hold');
  if (counted.length === 0) return 0;
  return Math.round((counted.filter((task) => task.status === 'completed').length / counted.length) * 100);
}
