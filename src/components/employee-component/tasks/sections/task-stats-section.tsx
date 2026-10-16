import { Ban, CheckCircle2, CheckSquare, Circle, Eye, Loader, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getBoardColumns, getStatusMeta } from '@/lib/workflow';
import type { StatusCategory } from '@/types';
import type { TaskStatusFilter } from './task-utils';

const CATEGORY_ICON: Record<StatusCategory, LucideIcon> = { todo: Circle, active: Loader, review: Eye, done: CheckCircle2 };

// Total, one card per board column (following the workflow), and Blocked
function getStatCards(): { filter: TaskStatusFilter; label: string; icon: LucideIcon; iconClass: string }[] {
  return [
    { filter: 'all', label: 'Total Tasks', icon: CheckSquare, iconClass: 'bg-indigo-100 text-indigo-600' },
    ...getBoardColumns().map((column) => {
      const meta = getStatusMeta(column.status);
      return { filter: column.status, label: column.label, icon: CATEGORY_ICON[meta.category], iconClass: meta.className };
    }),
    { filter: 'blocked', label: 'Blocked', icon: Ban, iconClass: 'bg-red-100 text-red-600' },
  ];
}

interface TaskStatsSectionProps {
  counts: Record<string, number>;
  activeFilter: TaskStatusFilter;
  isLoading: boolean;
  onSelect: (filter: TaskStatusFilter) => void;
}

export function TaskStatsSection({ counts, activeFilter, isLoading, onSelect }: TaskStatsSectionProps) {
  return (
    // The number of cards follows the workflow, so the grid fits however many there are
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
      {getStatCards().map(({ filter, label, icon: Icon, iconClass }) => {
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
                      <p className="text-2xl font-bold text-gray-900">{counts[filter] ?? 0}</p>
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
