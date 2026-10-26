import type { TaskSection } from '@/lib/permissions/task-permissions';
import { PageTabs } from '@/components/common-component/tabs';
import { TASK_SECTION_META } from './task-config';

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
      tabs={sections.map((section) => ({ id: section, ...TASK_SECTION_META[section], count: counts[section] ?? 0, countTone: 'alert' as const }))}
      value={active}
      onChange={onChange}
    />
  );
}
