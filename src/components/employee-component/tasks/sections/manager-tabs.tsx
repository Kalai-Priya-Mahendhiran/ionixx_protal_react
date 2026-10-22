import { CalendarRange, CheckCheck, ClipboardList, Columns3, FolderKanban, Gauge, GitBranch, History, LayoutTemplate, ShieldCheck, Tags, Zap, type LucideIcon } from 'lucide-react';
import type { TaskSection } from '@/lib/permissions/task-permissions';
import { PageTabs } from '@/components/ui/page-tabs';

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
    <PageTabs
      label="Task tools"
      tabs={sections.map((section) => ({ id: section, ...SECTION_META[section], count: counts[section] ?? 0, countTone: 'alert' as const }))}
      value={active}
      onChange={onChange}
    />
  );
}
