import { CalendarRange, CheckCheck, ClipboardList, Columns3, FolderKanban, Gauge, GitBranch, History, LayoutTemplate, ShieldCheck, Tags, Zap, type LucideIcon } from 'lucide-react';
import type { TaskSection } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';

const SECTION_META: Record<TaskSection, { label: string; icon: LucideIcon }> = {
  board: { label: 'Board', icon: Columns3 },
  workload: { label: 'Workload', icon: Gauge },
  sprints: { label: 'Backlog & Sprints', icon: CalendarRange },
  approvals: { label: 'Approvals', icon: CheckCheck },
  projects: { label: 'Projects', icon: FolderKanban },
  checklists: { label: 'Checklists', icon: ClipboardList },
  templates: { label: 'Templates', icon: LayoutTemplate },
  workflow: { label: 'Workflow', icon: GitBranch },
  fields: { label: 'Types & Labels', icon: Tags },
  permissions: { label: 'Permissions', icon: ShieldCheck },
  automation: { label: 'Automation', icon: Zap },
  audit: { label: 'Audit log', icon: History },
};

interface SectionTabsProps {
  sections: TaskSection[];
  active: TaskSection;
  // Shown as a badge on the tab (e.g. approvals waiting)
  counts?: Partial<Record<TaskSection, number>>;
  onChange: (section: TaskSection) => void;
}

// Tool tabs at the top of the Tasks page (manager tools on team views, HR tools on the HR view)
export function SectionTabs({ sections, active, counts = {}, onChange }: SectionTabsProps) {
  return (
    <div role="tablist" aria-label="Task tools" className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sections.map((section) => {
        const { label, icon: Icon } = SECTION_META[section];
        const isActive = section === active;
        const count = counts[section] ?? 0;
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
            {count > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
