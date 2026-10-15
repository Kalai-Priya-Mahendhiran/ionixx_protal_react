import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ClipboardList, LogIn, LogOut, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import type { Task } from '@/types';
import { taskPath } from './task-link';
import { formatShortDate, getDueState, progressPercent, type SubtaskProgress } from './task-utils';

type ChecklistFilter = 'active' | 'completed';

const LABEL_ICON: Record<string, LucideIcon> = { onboarding: LogIn, offboarding: LogOut };

interface ChecklistsSectionProps {
  // Every visible task (parents and sub-tasks)
  tasks: Task[];
  subtaskProgress: Map<string, SubtaskProgress>;
  onBrowseTemplates: () => void;
}

// Running onboarding / offboarding checklists, one card per employee
export function ChecklistsSection({ tasks, subtaskProgress, onBrowseTemplates }: ChecklistsSectionProps) {
  const location = useLocation();
  const [filter, setFilter] = useState<ChecklistFilter>('active');

  const checklists = tasks.filter((task) => !task.parentId && task.templateId);
  const isComplete = (task: Task) => {
    const progress = subtaskProgress.get(task.id);
    return task.status === 'done' || (!!progress && progress.total > 0 && progress.done === progress.total);
  };
  const shown = checklists.filter((task) => (filter === 'completed' ? isComplete(task) : !isComplete(task))).sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''));
  const counts = { active: checklists.filter((task) => !isComplete(task)).length, completed: checklists.filter(isComplete).length };

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Checklists" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
        {(['active', 'completed'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
            className={cn('rounded-md px-3 py-1.5 text-sm font-medium capitalize', filter === value ? 'bg-indigo-50 text-[#464EB8]' : 'text-gray-600 hover:text-gray-900')}
          >
            {value} <span className="text-xs text-gray-500">({counts[value]})</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-lg font-medium text-gray-900">{filter === 'active' ? 'No checklists in progress' : 'No completed checklists yet'}</h2>
            {filter === 'active' && (
              <p className="text-gray-600">
                Start one from a{' '}
                <button type="button" onClick={onBrowseTemplates} className="font-medium text-[#464EB8] hover:underline">
                  template
                </button>
                , for example New Joiner Onboarding.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((checklist) => {
            const subject = getUserById(checklist.subjectId);
            const progress = subtaskProgress.get(checklist.id) ?? { done: 0, total: 0 };
            const percent = progressPercent(progress);
            const items = tasks.filter((task) => task.parentId === checklist.id);
            const overdue = items.filter((task) => getDueState(task) === 'overdue').length;
            const kind = checklist.labels.find((label) => label in LABEL_ICON);
            const Icon = kind ? LABEL_ICON[kind] : ClipboardList;
            const nextItem = items.filter((task) => task.status !== 'done').sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
            return (
              <Link key={checklist.id} to={taskPath(checklist.key)} state={{ from: location.search }} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {getInitials(subject?.name ?? '?')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                          <Icon className="h-3.5 w-3.5" />
                          {kind ?? 'Checklist'} · {checklist.key}
                        </p>
                        <h3 className="truncate font-semibold text-gray-900 group-hover:text-[#464EB8]">{subject?.name ?? checklist.title}</h3>
                        <p className="text-xs text-gray-500">
                          {subject?.designation}
                          {kind === 'onboarding' && subject?.joiningDate && ` · Joins ${formatShortDate(subject.joiningDate)}`}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>
                          {progress.done}/{progress.total} done
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className={cn('h-full rounded-full', percent === 100 ? 'bg-green-500' : 'bg-[#464EB8]')} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {overdue > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          {overdue} overdue
                        </span>
                      )}
                      {nextItem ? (
                        <span className="truncate text-gray-600">
                          Next: {nextItem.title} · {formatShortDate(nextItem.dueDate)}
                        </span>
                      ) : (
                        <span className="text-green-700">All items done</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
