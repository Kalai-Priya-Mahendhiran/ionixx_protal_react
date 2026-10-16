import { Ban, CheckCircle2, CheckSquare, Circle, Eye, Loader, type LucideIcon } from 'lucide-react';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
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
    <StatGrid>
      {getStatCards().map(({ filter, label, icon, iconClass }) => (
        <StatCard
          key={filter}
          icon={icon}
          label={label}
          value={counts[filter] ?? 0}
          iconClassName={iconClass}
          loading={isLoading}
          active={activeFilter === filter}
          onClick={() => onSelect(filter)}
        />
      ))}
    </StatGrid>
  );
}
