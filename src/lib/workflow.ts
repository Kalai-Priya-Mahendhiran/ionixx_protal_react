import { getTaskSettings } from '@/lib/task-settings-store';
import { defaultLabelColor } from '@/lib/task-settings-defaults';
import type { LabelColor, StatusCategory, StatusColor, TaskPriority, TaskStatus, TaskType, WorkflowStatus } from '@/types';

/*
 * Reading the configured workflow, task types, priorities and labels.
 * Everything that shows or moves a status goes through here, so the board,
 * menus and permission checks follow whatever the System Admin set up.
 */

// Statuses the rest of the code depends on: new work starts in To Do, Done means finished
export const LOCKED_STATUSES: TaskStatus[] = ['todo', 'done'];

export const STATUS_COLOR_CLASSES: Record<StatusColor, { badge: string; dot: string }> = {
  gray: { badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  blue: { badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  indigo: { badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  purple: { badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  teal: { badge: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
  green: { badge: 'bg-green-100 text-green-800', dot: 'bg-green-500' },
  amber: { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  red: { badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
};

export const LABEL_COLOR_CLASSES: Record<LabelColor, string> = {
  sky: 'bg-sky-100 text-sky-800',
  pink: 'bg-pink-100 text-pink-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  violet: 'bg-violet-100 text-violet-800',
  rose: 'bg-rose-100 text-rose-800',
  teal: 'bg-teal-100 text-teal-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-700',
};

export interface StatusMeta {
  id: TaskStatus;
  label: string;
  className: string;
  dotClass: string;
  category: StatusCategory;
  enabled: boolean;
}

/* ---------- Statuses ---------- */

export function getWorkflowStatuses(includeHidden = false): WorkflowStatus[] {
  const { statuses } = getTaskSettings().workflow;
  return includeHidden ? statuses : statuses.filter((status) => status.enabled);
}

// Unknown statuses (e.g. one removed from the workflow) still render, in gray
export function getStatusMeta(id: TaskStatus): StatusMeta {
  const status = getTaskSettings().workflow.statuses.find((item) => item.id === id);
  const colors = STATUS_COLOR_CLASSES[status?.color ?? 'gray'];
  return {
    id,
    label: status?.label ?? id,
    className: colors.badge,
    dotClass: colors.dot,
    category: status?.category ?? 'active',
    enabled: status?.enabled ?? false,
  };
}

export const getStatusLabel = (id: TaskStatus) => getStatusMeta(id).label;

// A move is allowed when the workflow lists it and the target status is in use
export function isTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to || !getStatusMeta(to).enabled) return false;
  const { transitions } = getTaskSettings().workflow;
  // A status with no rules (e.g. a task left in a removed status) can move anywhere, so it isn't stuck
  return transitions[from] === undefined ? true : transitions[from].includes(to);
}

/* ---------- Board columns ---------- */

export interface BoardColumnDef {
  status: TaskStatus;
  label: string;
  dotClass: string;
}

// The column a status's cards appear in: its own, or the column it is grouped into
export function getBoardColumn(id: TaskStatus): TaskStatus {
  const status = getTaskSettings().workflow.statuses.find((item) => item.id === id);
  const target = status?.boardColumn && getWorkflowStatuses().find((item) => item.id === status.boardColumn && !item.boardColumn);
  return target ? target.id : id;
}

export function getBoardColumns(): BoardColumnDef[] {
  return getWorkflowStatuses()
    .filter((status) => getBoardColumn(status.id) === status.id)
    .map((status) => ({ status: status.id, label: status.label, dotClass: STATUS_COLOR_CLASSES[status.color].dot }));
}

// Statuses shown in a column, the column's own status first (used to pick the status for a drop)
export function getColumnStatuses(column: TaskStatus): TaskStatus[] {
  return getWorkflowStatuses()
    .filter((status) => getBoardColumn(status.id) === column)
    .sort((a, b) => Number(b.id === column) - Number(a.id === column))
    .map((status) => status.id);
}

/* ---------- Types, priorities and labels ---------- */

export function getTypeLabel(type: TaskType): string {
  return getTaskSettings().issueTypes.find((item) => item.type === type)?.label ?? type;
}

export function isTypeEnabled(type: TaskType): boolean {
  return getTaskSettings().issueTypes.find((item) => item.type === type)?.enabled ?? true;
}

export function getPriorityLabel(priority: TaskPriority): string {
  return getTaskSettings().priorities.find((item) => item.priority === priority)?.label ?? priority;
}

export function getLabelColor(name: string): string {
  const configured = getTaskSettings().labels.find((label) => label.name.toLowerCase() === name.toLowerCase());
  return LABEL_COLOR_CLASSES[configured?.color ?? defaultLabelColor(name)];
}

export const getConfiguredLabels = () => getTaskSettings().labels.map((label) => label.name);
