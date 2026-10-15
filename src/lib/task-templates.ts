import { USER_DIRECTORY, getUserById } from '@/lib/user-directory';
import { toDateInput } from '@/lib/utils';
import type { TaskTemplate, TaskTemplateItem, TemplateKind, TemplateOwner } from '@/types';

/*
 * Turning a template into a concrete checklist: who owns each item and when it is due.
 * Shared by the Apply dialog's preview and the task service, so what you preview is what gets created.
 */

export const TEMPLATE_KIND_LABELS: Record<TemplateKind, string> = {
  onboarding: 'Onboarding',
  offboarding: 'Offboarding',
  custom: 'Custom',
};

export const TEMPLATE_OWNER_LABELS: Record<TemplateOwner, string> = {
  hr: 'HR (you)',
  it: 'IT team',
  manager: "Employee's manager",
  employee: 'The employee',
  specific: 'Specific person',
};

// What the anchor date means for each kind of checklist
export const TEMPLATE_ANCHOR_LABELS: Record<TemplateKind, string> = {
  onboarding: 'Joining date',
  offboarding: 'Last working day',
  custom: 'Start date',
};

export interface ChecklistPlanItem {
  item: TaskTemplateItem;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
}

export interface ChecklistPlan {
  title: string;
  items: ChecklistPlanItem[];
  startDate: string;
  dueDate: string;
  estimateHours: number;
}

const addDays = (anchor: string, days: number) => {
  const [year, month, day] = anchor.split('-').map(Number);
  return toDateInput(new Date(year, month - 1, day + days));
};

const firstWithRole = (role: string) => USER_DIRECTORY.find((user) => user.role === role)?.id;

// HR items go to the person applying the template when they're in HR, else to the HR team;
// IT items to the system administrators; manager items to the employee's reporting manager
export function resolveOwner(item: TaskTemplateItem, subjectId: string, actor: { id: string; role: string }): string {
  switch (item.owner) {
    case 'hr':
      return actor.role === 'hr' ? actor.id : (firstWithRole('hr') ?? actor.id);
    case 'it':
      return firstWithRole('system_admin') ?? actor.id;
    case 'manager':
      return getUserById(subjectId)?.managerId ?? actor.id;
    case 'employee':
      return subjectId;
    case 'specific':
      return item.ownerId && getUserById(item.ownerId) ? item.ownerId : actor.id;
  }
}

export function checklistTitle(template: Pick<TaskTemplate, 'kind' | 'name'>, subjectName: string): string {
  return template.kind === 'custom' ? `${template.name}: ${subjectName}` : `${TEMPLATE_KIND_LABELS[template.kind]}: ${subjectName}`;
}

export function planChecklist(template: TaskTemplate, subjectId: string, anchorDate: string, actor: { id: string; role: string }): ChecklistPlan {
  const subjectName = getUserById(subjectId)?.name ?? 'Unknown employee';
  const items = [...template.items]
    .sort((a, b) => a.offsetDays - b.offsetDays)
    .map((item) => ({ item, assigneeId: resolveOwner(item, subjectId, actor), dueDate: addDays(anchorDate, item.offsetDays) }));
  const dates = items.map((planned) => planned.dueDate).sort();
  return {
    title: checklistTitle(template, subjectName),
    items,
    startDate: dates[0] ?? anchorDate,
    dueDate: dates[dates.length - 1] ?? anchorDate,
    estimateHours: items.reduce((sum, planned) => sum + (planned.item.estimateHours ?? 0), 0),
  };
}

// "Day −3", "Day 0", "Day +7"
export function formatOffset(days: number): string {
  if (days === 0) return 'Day 0';
  return days > 0 ? `Day +${days}` : `Day −${Math.abs(days)}`;
}
