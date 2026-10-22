import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle, Clock, Target } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { LEAVE_BALANCE } from '@/lib/sample-data/leave-tracker-sample-data';
import { toDateInput, todayAsDateInput } from '@/lib/utils';
import { useMyAttendanceMonth } from '@/services/apis/attendance/use-attendance';
import { useLeaveRequests } from '@/services/apis/leave/use-leave';
import { useTasks } from '@/services/apis/tasks/use-tasks';
import { useTimeEntries } from '@/services/apis/time-tracker/use-time-entries';

// Leave types counted in "days left" (the everyday ones with a yearly allotment)
const EVERYDAY_LEAVE = ['casual', 'sick', 'earned'] as const;
const ATTENDED = new Set(['present', 'late', 'half-day', 'wfh']);

// Monday of the current week
const weekStart = () => {
  const date = new Date();
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateInput(date);
};

// Your numbers, worked out from your attendance, tasks, time entries and leave; each card opens its page
export function QuickStatsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = todayAsDateInput();
  const { data: month = [], isLoading: loadingAttendance } = useMyAttendanceMonth(today.slice(0, 7));
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: entries = [], isLoading: loadingEntries } = useTimeEntries();
  const { data: leave = [], isLoading: loadingLeave } = useLeaveRequests();

  const working = month.filter((day) => !['holiday', 'leave', 'not-in-yet'].includes(day.status));
  const attendance = working.length ? Math.round((working.filter((day) => ATTENDED.has(day.status)).length / working.length) * 100) : 100;

  const mine = tasks.filter((task) => task.assigneeId === user?.id);
  const done = mine.filter((task) => task.status === 'done').length;

  const from = weekStart();
  const hours = entries.filter((entry) => entry.date >= from && entry.date <= today).reduce((total, entry) => total + entry.totalHours, 0);

  const allotted = EVERYDAY_LEAVE.reduce((total, type) => total + (LEAVE_BALANCE[type] ?? 0), 0);
  const used = leave.filter((request) => request.status === 'approved' && (EVERYDAY_LEAVE as readonly string[]).includes(request.leaveType)).reduce((total, request) => total + (request.days ?? 0), 0);

  return (
    <StatGrid>
      <StatCard icon={CheckCircle} label="Attendance this month" value={`${attendance}%`} tone="green" hint={`${working.length} days`} loading={loadingAttendance} onClick={() => navigate('/attendance')} />
      <StatCard icon={Target} label="My tasks done" value={`${done}/${mine.length}`} tone="blue" loading={loadingTasks} onClick={() => navigate('/tasks')} />
      <StatCard icon={Clock} label="Hours this week" value={`${Math.round(hours * 10) / 10}h`} tone="purple" loading={loadingEntries} onClick={() => navigate('/time-tracker')} />
      <StatCard icon={CalendarDays} label="Leave days left" value={allotted - used} tone="amber" hint={`of ${allotted}`} loading={loadingLeave} onClick={() => navigate('/leave')} />
    </StatGrid>
  );
}
