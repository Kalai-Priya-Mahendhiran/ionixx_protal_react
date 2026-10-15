import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Ban, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import { getUserById } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';
import { taskPath } from './task-link';
import { daysUntil, getTeamAlerts } from './task-utils';

const MAX_ROWS = 5;

function AlertList({ title, icon: Icon, tasks, detail }: { title: string; icon: typeof Ban; tasks: Task[]; detail: (task: Task) => string }) {
  const location = useLocation();
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-red-100 bg-white p-3">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-red-800">
        <Icon className="h-4 w-4" />
        {title}
        <span className="rounded-full bg-red-100 px-2 text-xs">{tasks.length}</span>
      </h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">None 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.slice(0, MAX_ROWS).map((task) => (
            <li key={task.id} className="flex items-baseline gap-2 text-sm">
              <Link to={taskPath(task.key)} state={{ from: location.search }} className="shrink-0 font-medium text-[#464EB8] hover:underline">
                {task.key}
              </Link>
              <span className="min-w-0 flex-1 truncate text-gray-800" title={task.title}>
                {task.title}
              </span>
              <span className="shrink-0 text-xs text-gray-500">{getUserById(task.assigneeId)?.name.split(' ')[0]}</span>
              <span className="max-w-[45%] shrink-0 truncate text-xs font-medium text-red-700" title={detail(task)}>
                {detail(task)}
              </span>
            </li>
          ))}
          {tasks.length > MAX_ROWS && <li className="text-xs text-gray-500">+{tasks.length - MAX_ROWS} more</li>}
        </ul>
      )}
    </div>
  );
}

// Overdue and blocked work across the team, so a manager can step in
export function TeamAlertsPanel({ tasks }: { tasks: Task[] }) {
  const { overdue, blocked } = getTeamAlerts(tasks);
  const [open, setOpen] = useState(true);
  const total = overdue.length + blocked.length;

  if (total === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-800">
        <ShieldCheck className="h-4 w-4" />
        No overdue or blocked work in your team.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-red-200 bg-red-50/60 p-3" aria-label="Team alerts">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        {open ? <ChevronDown className="h-4 w-4 text-red-700" /> : <ChevronRight className="h-4 w-4 text-red-700" />}
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="font-semibold text-red-900">Needs attention</span>
        <span className="text-sm text-red-800">
          {overdue.length} overdue · {blocked.length} blocked
        </span>
      </button>
      <div className={cn('mt-3 flex flex-col gap-3 md:flex-row', !open && 'hidden')}>
        <AlertList title="Overdue" icon={AlertTriangle} tasks={overdue} detail={(task) => `${Math.abs(daysUntil(task.dueDate))}d late`} />
        <AlertList title="Blocked" icon={Ban} tasks={blocked} detail={(task) => task.blockedReason ?? 'Blocked'} />
      </div>
    </section>
  );
}
