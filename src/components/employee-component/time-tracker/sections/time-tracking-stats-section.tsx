import { Clock, Calendar, BarChart3, AlertTriangle, CircleDashed, CheckCircle2, PauseCircle, PlayCircle, type LucideIcon } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import type { TimeEntry } from '@/types';
import { toDateInput, todayAsDateInput } from '@/lib/utils';
import { getDailyHours, type TaskRecord } from './task-form';
import { DAILY_HOUR_LIMIT } from '@/lib/constants';

// The task-status cards filter the task list below; 'all' = no card filter
export type TaskCardFilter = 'all' | 'overrunning' | TaskRecord['status'];

interface TimeTrackingStatsSectionProps {
  entries: TimeEntry[];
  tasks: TaskRecord[];
  productivity: number;
  taskFilter: TaskCardFilter;
  onTaskFilterChange: (filter: TaskCardFilter) => void;
}

interface StatusCard {
  filter: Exclude<TaskCardFilter, 'all'>;
  label: string;
  count: number;
  icon: LucideIcon;
  iconClass: string;
}

export function TimeTrackingStatsSection({ entries, tasks, productivity, taskFilter, onTaskFilterChange }: TimeTrackingStatsSectionProps) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartDate = toDateInput(weekStart);
  const weekEndDate = toDateInput(weekEnd);
  const currentMonth = todayAsDateInput().slice(0, 7);

  const totalHoursThisWeek = entries.reduce((total, entry) =>
    entry.date >= weekStartDate && entry.date <= weekEndDate ? total + entry.totalHours : total, 0);

  const totalHoursThisMonth = entries.reduce((total, entry) =>
    entry.date.slice(0, 7) === currentMonth ? total + entry.totalHours : total, 0);

  const dailyHours = getDailyHours(tasks);
  const countByStatus = (status: TaskRecord['status']) => tasks.filter((task) => task.status === status).length;

  // Icon colours follow the task status colours used in the task list
  const statusCards: StatusCard[] = [
    {
      filter: 'overrunning',
      label: 'Overrunning',
      count: tasks.filter((task) => dailyHours[task.date] > DAILY_HOUR_LIMIT).length,
      icon: AlertTriangle,
      iconClass: 'bg-red-100 text-red-600',
    },
    {
      filter: 'not-started',
      label: 'Not Started',
      count: countByStatus('not-started'),
      icon: CircleDashed,
      iconClass: 'bg-yellow-100 text-yellow-600',
    },
    {
      filter: 'started',
      label: 'In Progress',
      count: countByStatus('started'),
      icon: PlayCircle,
      iconClass: 'bg-white border border-gray-300 text-gray-600',
    },
    {
      filter: 'completed',
      label: 'Completed',
      count: countByStatus('completed'),
      icon: CheckCircle2,
      iconClass: 'bg-green-100 text-green-600',
    },
    {
      filter: 'hold',
      label: 'Hold',
      count: countByStatus('hold'),
      icon: PauseCircle,
      iconClass: 'bg-[#BBBBBB] text-gray-800',
    },
  ];

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard icon={Clock} label="This Week" value={`${totalHoursThisWeek.toFixed(1)}h`} tone="blue" />
        <StatCard icon={Calendar} label="This Month" value={`${totalHoursThisMonth.toFixed(1)}h`} tone="green" />
        <StatCard icon={BarChart3} label="Productivity" value={`${productivity}%`} tone="purple" />
      </StatGrid>

      {/* Task status: each card filters the task list; clicking the active card shows all tasks again */}
      <StatGrid>
        {statusCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.count}
            iconClassName={card.iconClass}
            active={taskFilter === card.filter}
            onClick={() => onTaskFilterChange(taskFilter === card.filter ? 'all' : card.filter)}
          />
        ))}
      </StatGrid>
    </div>
  );
}
