import { PageTabs } from '@/components/ui/page-tabs';
import { MY_TASKS_TABS, type MyTasksTab } from './task-utils';

interface TaskTabsProps {
  active: MyTasksTab;
  counts: Record<MyTasksTab, number>;
  onChange: (tab: MyTasksTab) => void;
}

export function TaskTabs({ active, counts, onChange }: TaskTabsProps) {
  return <PageTabs label="My tasks" tabs={MY_TASKS_TABS.map((tab) => ({ id: tab.value, label: tab.label, count: counts[tab.value] }))} value={active} onChange={onChange} />;
}
