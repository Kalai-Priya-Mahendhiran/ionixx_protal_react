import { Ban, CheckCircle2, CheckSquare, Circle, Eye, Loader, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TaskStatusFilter } from './task-utils';

const STAT_CARDS: { filter: TaskStatusFilter; label: string; icon: LucideIcon; iconClass: string }[] = [
  { filter: 'all', label: 'Total Tasks', icon: CheckSquare, iconClass: 'bg-indigo-100 text-indigo-600' },
  { filter: 'todo', label: 'To Do', icon: Circle, iconClass: 'bg-gray-100 text-gray-600' },
  { filter: 'in-progress', label: 'In Progress', icon: Loader, iconClass: 'bg-blue-100 text-blue-600' },
  { filter: 'in-review', label: 'In Review', icon: Eye, iconClass: 'bg-purple-100 text-purple-600' },
  { filter: 'done', label: 'Done', icon: CheckCircle2, iconClass: 'bg-green-100 text-green-600' },
  { filter: 'blocked', label: 'Blocked', icon: Ban, iconClass: 'bg-red-100 text-red-600' },
];

interface TaskStatsSectionProps {
  counts: Record<TaskStatusFilter, number>;
  activeFilter: TaskStatusFilter;
  isLoading: boolean;
  onSelect: (filter: TaskStatusFilter) => void;
}

export function TaskStatsSection({ counts, activeFilter, isLoading, onSelect }: TaskStatsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {STAT_CARDS.map(({ filter, label, icon: Icon, iconClass }) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect(filter)}
            aria-pressed={isActive}
            className="rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/50"
          >
            <Card className={cn('h-full transition-all hover:shadow-md', isActive && 'ring-2 ring-[#464EB8] shadow-md')}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-lg p-2', iconClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    {isLoading ? (
                      <div className="mt-1 h-7 w-8 animate-pulse rounded bg-gray-200" />
                    ) : (
                      <p className="text-2xl font-bold text-gray-900">{counts[filter]}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        );
      })}
    </div>
  );
}
