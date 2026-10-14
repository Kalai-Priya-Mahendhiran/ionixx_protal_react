import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, BarChart3, AlertTriangle, CircleDashed, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';
import type { TimeEntry } from '@/types';
import { toDateInput, todayAsDateInput } from '@/lib/utils';
import { getDailyHours, type TaskRecord } from './task-form';
import { DAILY_HOUR_LIMIT } from '@/lib/constants';

interface TimeTrackingStatsSectionProps {
  entries: TimeEntry[];
  tasks: TaskRecord[];
  productivity: number;
}

interface StatusCard {
  label: string;
  count: number;
  icon: ReactNode;
  cardClass: string;
  iconClass: string;
}

export function TimeTrackingStatsSection({ entries, tasks, productivity }: TimeTrackingStatsSectionProps) {
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

  const statusCards: StatusCard[] = [
    {
      label: 'Overrunning',
      count: tasks.filter((task) => dailyHours[task.date] > DAILY_HOUR_LIMIT).length,
      icon: <AlertTriangle className="h-5 w-5" />,
      cardClass: 'bg-red-50 border-red-200',
      iconClass: 'bg-red-100 text-red-600',
    },
    {
      label: 'Not Started',
      count: countByStatus('not-started'),
      icon: <CircleDashed className="h-5 w-5" />,
      cardClass: 'bg-yellow-50 border-yellow-200',
      iconClass: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'In Progress',
      count: countByStatus('started'),
      icon: <PlayCircle className="h-5 w-5" />,
      cardClass: 'bg-white border-gray-300',
      iconClass: 'bg-white border border-gray-300 text-gray-600',
    },
    {
      label: 'Completed',
      count: countByStatus('completed'),
      icon: <CheckCircle2 className="h-5 w-5" />,
      cardClass: 'bg-green-50 border-green-200',
      iconClass: 'bg-green-100 text-green-600',
    },
    {
      label: 'Hold',
      count: countByStatus('hold'),
      icon: <PauseCircle className="h-5 w-5" />,
      cardClass: 'bg-[#BBBBBB]/30 border-[#BBBBBB]',
      iconClass: 'bg-[#BBBBBB] text-gray-800',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="px-5 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-xl font-bold text-gray-900">{totalHoursThisWeek.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="px-5 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-xl font-bold text-gray-900">{totalHoursThisMonth.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="px-5 py-4">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Productivity</p>
                <p className="text-xl font-bold text-gray-900">{productivity}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <Card key={card.label} className={`shadow-md ${card.cardClass}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${card.iconClass}`}>{card.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
