import { cn } from '@/lib/utils';
import { MY_TASKS_TABS, type MyTasksTab } from './task-utils';

interface TaskTabsProps {
  active: MyTasksTab;
  counts: Record<MyTasksTab, number>;
  onChange: (tab: MyTasksTab) => void;
}

export function TaskTabs({ active, counts, onChange }: TaskTabsProps) {
  return (
    <div role="tablist" aria-label="My tasks" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {MY_TASKS_TABS.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'border-[#464EB8] text-[#464EB8]' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
            )}
          >
            {tab.label}
            <span className={cn('rounded-full px-2 py-0.5 text-xs', isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600')}>
              {counts[tab.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
