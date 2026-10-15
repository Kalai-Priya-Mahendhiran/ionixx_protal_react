import { CalendarRange, CheckCheck, Columns3, Gauge, type LucideIcon } from 'lucide-react';
import type { ManagerSection } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';

const SECTION_META: Record<ManagerSection, { label: string; icon: LucideIcon }> = {
  board: { label: 'Board', icon: Columns3 },
  workload: { label: 'Workload', icon: Gauge },
  sprints: { label: 'Backlog & Sprints', icon: CalendarRange },
  approvals: { label: 'Approvals', icon: CheckCheck },
};

interface ManagerTabsProps {
  sections: ManagerSection[];
  active: ManagerSection;
  approvalCount: number;
  onChange: (section: ManagerSection) => void;
}

export function ManagerTabs({ sections, active, approvalCount, onChange }: ManagerTabsProps) {
  return (
    <div role="tablist" aria-label="Manager tools" className="ionixx-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200">
      {sections.map((section) => {
        const { label, icon: Icon } = SECTION_META[section];
        const isActive = section === active;
        return (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(section)}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'border-[#464EB8] text-[#464EB8]' : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {section === 'approvals' && approvalCount > 0 && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{approvalCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
