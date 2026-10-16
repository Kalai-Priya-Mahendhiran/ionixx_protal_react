import type { ReactNode, Ref } from 'react';
import { Columns3, List, Rows3, Search, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TaskLayout } from './task-states';
import { getStatusFilterOptions, type TaskStatusFilter } from './task-utils';

const LAYOUT_OPTIONS: { value: TaskLayout; label: string; icon: LucideIcon }[] = [
  { value: 'board', label: 'Board', icon: Columns3 },
  { value: 'list', label: 'List', icon: List },
];

interface TaskFiltersSectionProps {
  searchTerm: string;
  statusFilter: TaskStatusFilter;
  layout: TaskLayout;
  onSearchChange: (term: string) => void;
  onStatusFilterChange: (filter: TaskStatusFilter) => void;
  onLayoutChange: (layout: TaskLayout) => void;
  groupByAssignee?: boolean;
  // Only passed for people who can reassign work (managers, admins)
  onGroupByAssigneeChange?: (groupByAssignee: boolean) => void;
  // Extra controls next to the layout switch (e.g. Filters, Export) and a row below (active filter chips)
  actions?: ReactNode;
  footer?: ReactNode;
  // Lets the page focus search from the "/" shortcut
  searchInputRef?: Ref<HTMLInputElement>;
}

export function TaskFiltersSection({
  searchTerm,
  statusFilter,
  layout,
  onSearchChange,
  onStatusFilterChange,
  onLayoutChange,
  groupByAssignee = false,
  onGroupByAssigneeChange,
  actions,
  footer,
  searchInputRef,
}: TaskFiltersSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search key, title, label, person…"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              aria-label="Search tasks"
              aria-keyshortcuts="/"
              className="peer w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
            {!searchTerm && (
              <kbd
                className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-gray-300 bg-gray-50 px-1.5 font-mono text-xs text-gray-500 peer-focus:hidden sm:block"
                title="Press / to search"
              >
                /
              </kbd>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusFilterOptions().map((option) => {
              const isActive = statusFilter === option.value;
              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => onStatusFilterChange(option.value)}
                  aria-pressed={isActive}
                  className={isActive ? 'bg-[#464EB8] text-white hover:bg-[#3a3f9a]' : ''}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
          {/* One wrapping row of controls on small screens instead of a stack of full-width buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {onGroupByAssigneeChange && layout === 'board' && (
              <button
                type="button"
                onClick={() => onGroupByAssigneeChange(!groupByAssignee)}
                aria-pressed={groupByAssignee}
                title="Show one row per person; drag a card to another row to reassign it"
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  groupByAssignee ? 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]' : 'border-gray-200 bg-white text-gray-600 hover:text-gray-900',
                )}
              >
                <Rows3 className="h-4 w-4" />
                Group by assignee
              </button>
            )}
            <div role="group" aria-label="Layout" className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {LAYOUT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onLayoutChange(value)}
                  aria-pressed={layout === value}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    layout === value ? 'bg-white text-[#464EB8] shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {footer && <div className="mt-3 space-y-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}
