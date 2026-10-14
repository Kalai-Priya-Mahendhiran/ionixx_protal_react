import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ListChecks } from 'lucide-react';
import { toDateInput, todayAsDateInput } from '@/lib/utils';
import { getDailyHours, getTaskHours, type TaskRecord } from './task-form';
import { DAILY_HOUR_LIMIT, TIME_TRACKER_STATUS_COLORS, TIME_TRACKER_STATUS_LABELS } from '@/lib/constants';

interface TodaysTasksSectionProps {
  tasks: TaskRecord[];
  onAddTask: () => void;
  onEditTask: (task: TaskRecord) => void;
  onDeleteTask: (taskId: string) => void;
}

// Show the last 7 days by default
const defaultFromDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return toDateInput(date);
};

export function TodaysTasksSection({ tasks, onAddTask, onEditTask, onDeleteTask }: TodaysTasksSectionProps) {
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(todayAsDateInput);
  const [dateRange, setDateRange] = useState({ from: defaultFromDate(), to: todayAsDateInput() });

  const filteredTasks = tasks.filter((task) =>
    (!dateRange.from || task.date >= dateRange.from) && (!dateRange.to || task.date <= dateRange.to)
  );
  const dailyHours = getDailyHours(filteredTasks);
  const totalTaskHours = filteredTasks.reduce((total, task) => total + getTaskHours(task), 0);
  const overrunDays = Object.values(dailyHours).filter((hours) => hours > DAILY_HOUR_LIMIT).length;
  const today = todayAsDateInput();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#464EB8]" />
            Today's Tasks
          </span>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onAddTask} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <Plus className="mr-2 h-4 w-4" />
              Add task
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Tasks and hours recorded for the selected date range</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-lg bg-indigo-50/60 p-4">
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            From date
            <input
              type="date"
              value={fromDate}
              max={toDate || today}
              onChange={(event) => setFromDate(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-gray-700">
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              onChange={(event) => setToDate(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </label>
          <Button onClick={() => setDateRange({ from: fromDate, to: toDate })} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            Search
          </Button>
          <Button
            variant="outline"
            className="border-[#464EB8]/30 text-[#464EB8] hover:bg-[#464EB8]/5 hover:text-[#464EB8]"
            onClick={() => {
              const from = defaultFromDate();
              const today = todayAsDateInput();
              setFromDate(from);
              setToDate(today);
              setDateRange({ from, to: today });
            }}
          >
            Reset
          </Button>
          <div className={`ml-auto text-sm font-semibold ${overrunDays ? 'text-red-700' : 'text-gray-700'}`}>
            {totalTaskHours.toFixed(1)}h recorded / {DAILY_HOUR_LIMIT}h per day
            {overrunDays > 0 && <span className="ml-2">({overrunDays} day{overrunDays === 1 ? '' : 's'} over limit)</span>}
          </div>
        </div>
        <div className="max-h-[28rem] overflow-auto rounded-md border">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-50 text-xs uppercase text-[#464EB8]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Project name</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned hours</th>
                <th className="px-4 py-3">Actual hours</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const isOverrun = dailyHours[task.date] > DAILY_HOUR_LIMIT;
                const rowTone = isOverrun
                  ? 'bg-red-50'
                  : task.status === 'completed'
                    ? 'bg-green-50'
                    : task.status === 'not-started'
                      ? 'bg-yellow-50'
                      : task.status === 'hold' ? 'bg-[#BBBBBB]/30' : 'bg-white';
                return (
                  <tr key={task.id} className={`border-t ${rowTone}`}>
                    <td className="whitespace-nowrap px-4 py-3">{task.date}</td>
                    <td className="px-4 py-3">{task.project}</td>
                    <td className="px-4 py-3">{task.module}</td>
                    <td className="px-4 py-3">{task.task}</td>
                    <td className="max-w-xs px-4 py-3">{task.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge className={TIME_TRACKER_STATUS_COLORS[task.status]}>{TIME_TRACKER_STATUS_LABELS[task.status]}</Badge>
                        {isOverrun && <Badge className="bg-red-100 text-red-800">Overrunning</Badge>}
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${isOverrun ? 'font-semibold text-red-700' : ''}`}>
                      {task.estimateHours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3">{task.actualHours === undefined ? '—' : `${task.actualHours.toFixed(1)}h`}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${task.task}`}
                          onClick={() => onEditTask(task)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${task.task}`}
                          onClick={() => onDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    No tasks found for the selected dates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
