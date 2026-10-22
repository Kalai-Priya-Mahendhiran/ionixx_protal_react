import { getUserById } from '@/lib/user-directory';
import { formatDateTime, todayAsDateInput } from '@/lib/utils';
import type { EpicSummary, Project, Sprint, Task } from '@/types';

/*
 * Exporting the task list as CSV or Excel. Only the tasks on screen are exported:
 * the caller passes the already permission-scoped, filtered list.
 */

export interface ExportLookups {
  projects: Project[];
  sprints: Sprint[];
  epics: EpicSummary[];
}

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  'in-review': 'In Review',
  done: 'Done',
  reopened: 'Reopened',
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const nameOf = (userId: string) => getUserById(userId)?.name ?? '';

// Column order and headings, shared by CSV and Excel
export const EXPORT_COLUMNS: { header: string; width: number; value: (task: Task, lookups: ExportLookups) => string | number }[] = [
  { header: 'Key', width: 10, value: (task) => task.key },
  { header: 'Title', width: 45, value: (task) => task.title },
  { header: 'Type', width: 10, value: (task) => (task.type === 'hr' ? 'HR' : capitalize(task.type)) },
  { header: 'Status', width: 12, value: (task) => STATUS_LABELS[task.status] },
  { header: 'Priority', width: 10, value: (task) => capitalize(task.priority) },
  { header: 'Project', width: 20, value: (task, { projects }) => projects.find((project) => project.id === task.projectId)?.name ?? '' },
  { header: 'Assignee', width: 20, value: (task) => nameOf(task.assigneeId) },
  { header: 'Department', width: 16, value: (task) => getUserById(task.assigneeId)?.department ?? '' },
  { header: 'Reporter', width: 20, value: (task) => nameOf(task.reporterId) },
  { header: 'Sprint', width: 16, value: (task, { sprints }) => sprints.find((sprint) => sprint.id === task.sprintId)?.name ?? '' },
  { header: 'Epic', width: 24, value: (task, { epics }) => epics.find((epic) => epic.id === task.epicId)?.title ?? '' },
  { header: 'Labels', width: 20, value: (task) => task.labels.join(', ') },
  { header: 'Start date', width: 12, value: (task) => task.startDate ?? '' },
  { header: 'Due date', width: 12, value: (task) => task.dueDate },
  { header: 'Estimate (h)', width: 12, value: (task) => task.estimateHours ?? '' },
  { header: 'Logged (h)', width: 11, value: (task) => task.loggedHours },
  { header: 'Blocked', width: 9, value: (task) => (task.isBlocked && task.status !== 'done' ? 'Yes' : '') },
  { header: 'Blocked reason', width: 30, value: (task) => (task.isBlocked && task.status !== 'done' ? (task.blockedReason ?? '') : '') },
  { header: 'Created', width: 20, value: (task) => formatDateTime(task.createdAt) },
  { header: 'Updated', width: 20, value: (task) => formatDateTime(task.updatedAt) },
];

export function buildExportRows(tasks: Task[], lookups: ExportLookups): (string | number)[][] {
  return tasks.map((task) => EXPORT_COLUMNS.map((column) => column.value(task, lookups)));
}

// RFC 4180: quote fields containing commas, quotes or line breaks; double any quotes.
// Leading =, +, - or @ is prefixed with ' so spreadsheet apps don't treat text as a formula.
export function toCsvField(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Written as a char code so the invisible character is not hidden in the source
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export function toCsv(tasks: Task[], lookups: ExportLookups): string {
  const lines = [EXPORT_COLUMNS.map((column) => column.header), ...buildExportRows(tasks, lookups)].map((row) => row.map(toCsvField).join(','));
  // The byte-order mark makes Excel read the file as UTF-8 (names, accents, currency symbols)
  return BYTE_ORDER_MARK + lines.join('\r\n');
}

export const exportFileName = (extension: 'csv' | 'xlsx') => `employee-portal-tasks-${todayAsDateInput()}.${extension}`;

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(tasks: Task[], lookups: ExportLookups) {
  downloadBlob(new Blob([toCsv(tasks, lookups)], { type: 'text/csv;charset=utf-8' }), exportFileName('csv'));
}

// The Excel writer is loaded only when someone exports, to keep it out of the main bundle
export async function downloadXlsx(tasks: Task[], lookups: ExportLookups) {
  const { default: writeXlsxFile } = await import('write-excel-file');
  const header = EXPORT_COLUMNS.map((column) => ({ value: column.header, fontWeight: 'bold' as const }));
  const rows = buildExportRows(tasks, lookups).map((row) =>
    row.map((value) => (typeof value === 'number' ? { type: Number, value } : { type: String, value })),
  );
  await writeXlsxFile([header, ...rows], {
    columns: EXPORT_COLUMNS.map((column) => ({ width: column.width })),
    fileName: exportFileName('xlsx'),
    sheet: 'Tasks',
  });
}
