import { useState } from 'react';
import { Timer } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleTimeEntries, sampleTodaysTasks, sampleProductivity, sampleWeeklyTimeDistribution } from '@/lib/sample-data/time-tracker-sample-data';
import {
  TimeTrackingStatsSection,
  TimerAndEntriesSection,
  TodaysTasksSection,
  WeeklyTimeChartSection,
  TaskDialog,
  EntryDialog
} from './sections';
import type { TaskRecord } from './sections/task-form';
import { hoursBetween } from './sections/time-entry-form';
import { todayAsDateInput } from '@/lib/utils';
import type { TimeEntryFormValues, TimeTrackerTaskFormRow, TimeTrackerTaskFormValues } from '@/lib/schemas';
import type { NewTimeEntry } from './sections/timer-and-entries-section';
import type { TimeEntry } from '@/types';

export default function TimeTracker() {
  const [tasks, setTasks] = useState<TaskRecord[]>(sampleTodaysTasks);
  const [taskDialog, setTaskDialog] = useState<{ task?: TaskRecord } | null>(null);
  const [entries, setEntries] = useState<TimeEntry[]>(sampleTimeEntries);
  const [entryDialog, setEntryDialog] = useState<{ entry?: TimeEntry } | null>(null);

  const recordEntry = (entry: NewTimeEntry) => {
    setEntries((current) => [{ ...entry, id: crypto.randomUUID(), userId: '1', status: 'submitted' }, ...current]);
  };

  const saveEntry = (values: TimeEntryFormValues) => {
    const details = {
      ...values,
      description: values.description.trim(),
      totalHours: hoursBetween(values.startTime, values.endTime),
    };
    if (entryDialog?.entry) {
      const entryId = entryDialog.entry.id;
      setEntries((current) => current.map((entry) => entry.id === entryId ? { ...entry, ...details } : entry));
    } else {
      recordEntry(details);
    }
    setEntryDialog(null);
  };

  // A completed task is dated by the date picked in the dialog
  const getTaskDate = (task: TimeTrackerTaskFormRow, fallbackDate: string) =>
    task.status === 'completed' && task.completedDate ? task.completedDate : fallbackDate;

  const saveTasks = (values: TimeTrackerTaskFormValues) => {
    if (taskDialog?.task) {
      const updatedTask = values.tasks[0];
      setTasks((current) => current.map((task) => task.id === taskDialog.task?.id
        ? { ...task, ...updatedTask, date: getTaskDate(updatedTask, task.date) }
        : task));
    } else {
      const newTasks = values.tasks.map((task) => ({
        ...task,
        id: crypto.randomUUID(),
        date: getTaskDate(task, todayAsDateInput()),
      }));
      setTasks((current) => [...newTasks, ...current]);
    }
    setTaskDialog(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Timer className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Time Tracker</h1>
              <p className="text-sm text-white/90 mt-0.5">Track time spent on projects and tasks</p>
            </div>
          </div>
        </div>

        {/* Time Tracking Stats */}
        <TimeTrackingStatsSection entries={entries} tasks={tasks} productivity={sampleProductivity} />

        {/* Timer and Today's Entries */}
        <TimerAndEntriesSection
          entries={entries}
          onRecordEntry={recordEntry}
          onAddEntry={() => setEntryDialog({})}
          onEditEntry={(entry) => setEntryDialog({ entry })}
          onDeleteEntry={(entryId) => setEntries((current) => current.filter((entry) => entry.id !== entryId))}
        />

        {/* Today's Tasks */}
        <TodaysTasksSection
          tasks={tasks}
          onAddTask={() => setTaskDialog({})}
          onEditTask={(task) => setTaskDialog({ task })}
          onDeleteTask={(taskId) => setTasks((current) => current.filter((entry) => entry.id !== taskId))}
        />

        {/* Weekly Time Chart */}
        <WeeklyTimeChartSection distribution={sampleWeeklyTimeDistribution} />
      </div>
      {taskDialog && (
        <TaskDialog
          key={taskDialog.task?.id ?? 'new'}
          task={taskDialog.task}
          onClose={() => setTaskDialog(null)}
          onSave={saveTasks}
        />
      )}
      {entryDialog && (
        <EntryDialog
          key={entryDialog.entry?.id ?? 'new'}
          entry={entryDialog.entry}
          onClose={() => setEntryDialog(null)}
          onSave={saveEntry}
        />
      )}
    </MainLayout>
  );
}
