import { useState } from 'react';
import { Timer } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { productivity, weeklyDistribution } from '@/lib/time-tracker-stats';
import { useAddTaskLog, useDeleteTaskLog, useTaskLog, useUpdateTaskLog } from '@/services/apis/time-tracker/use-task-log';
import { useCreateTimeEntry, useDeleteTimeEntry, useTimeEntries, useUpdateTimeEntry } from '@/services/apis/time-tracker/use-time-entries';
import {
  TimeTrackingStatsSection,
  TimerAndEntriesSection,
  TodaysTasksSection,
  WeeklyTimeChartSection,
  TaskDialog,
  EntryDialog
} from './sections';
import type { TaskRecord } from './sections/task-form';
import type { TaskCardFilter } from './sections/time-tracking-stats-section';
import { defaultTaskDateRange, isInTaskDateRange } from './sections/task-form';
import { hoursBetween } from './sections/time-entry-form';
import { todayAsDateInput } from '@/lib/utils';
import type { TimeEntryFormValues, TimeTrackerTaskFormRow, TimeTrackerTaskFormValues } from '@/lib/schemas';
import type { NewTimeEntry } from './sections/timer-and-entries-section';
import type { TimeEntry } from '@/types';

export default function TimeTracker() {
  // The daily task log is kept by the service, so it survives navigation
  const { data: tasks = [] } = useTaskLog();
  const addTasks = useAddTaskLog();
  const updateTask = useUpdateTaskLog();
  const deleteTask = useDeleteTaskLog();
  const [taskDialog, setTaskDialog] = useState<{ task?: TaskRecord } | null>(null);
  // Set by the task-status stat cards; narrows the task list
  const [taskFilter, setTaskFilter] = useState<TaskCardFilter>('all');
  // The task table's date range; the task-status cards count the same tasks the table shows
  const [taskRange, setTaskRange] = useState(defaultTaskDateRange);
  const tasksInRange = tasks.filter((task) => isInTaskDateRange(task, taskRange));
  // Entries come from the shared service, so work logged on a task shows up here too
  const { data: entries = [] } = useTimeEntries();
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const [entryDialog, setEntryDialog] = useState<{ entry?: TimeEntry } | null>(null);

  const recordEntry = (entry: NewTimeEntry) => createEntry.mutate(entry);

  const saveEntry = (values: TimeEntryFormValues) => {
    const details = {
      ...values,
      description: values.description.trim(),
      totalHours: hoursBetween(values.startTime, values.endTime),
    };
    if (entryDialog?.entry) {
      updateEntry.mutate({ id: entryDialog.entry.id, changes: details });
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
      updateTask.mutate({ id: taskDialog.task.id, changes: { ...updatedTask, date: getTaskDate(updatedTask, taskDialog.task.date) } });
    } else {
      addTasks.mutate(values.tasks.map((task) => ({ ...task, date: getTaskDate(task, todayAsDateInput()) })));
    }
    setTaskDialog(null);
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader icon={Timer} title="Time Tracker" description="Track time spent on projects and tasks" />

        {/* Time Tracking Stats */}
        <TimeTrackingStatsSection
          entries={entries}
          tasks={tasksInRange}
          productivity={productivity(tasksInRange)}
          taskFilter={taskFilter}
          onTaskFilterChange={setTaskFilter}
        />

        {/* Timer and Today's Entries */}
        <TimerAndEntriesSection
          entries={entries}
          onRecordEntry={recordEntry}
          onAddEntry={() => setEntryDialog({})}
          onEditEntry={(entry) => setEntryDialog({ entry })}
          onDeleteEntry={(entryId) => deleteEntry.mutate(entryId)}
        />

        {/* Today's Tasks */}
        <TodaysTasksSection
          tasks={tasks}
          cardFilter={taskFilter}
          dateRange={taskRange}
          onDateRangeChange={setTaskRange}
          onAddTask={() => setTaskDialog({})}
          onEditTask={(task) => setTaskDialog({ task })}
          onDeleteTask={(taskId) => deleteTask.mutate(taskId)}
        />

        {/* Weekly Time Chart */}
        {/* Worked out from this week's time entries */}
        <WeeklyTimeChartSection distribution={weeklyDistribution(entries, todayAsDateInput())} />
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
