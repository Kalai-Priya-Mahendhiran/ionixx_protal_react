import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Option } from '@/components/ui/form-fields';
import { can, getAssignableUsers, type PermissionUser } from '@/lib/permissions/task-permissions';
import { TASK_FIELD_NONE, TASK_ISSUE_TYPES, TASK_PRIORITIES } from '@/lib/schemas';
import { getConfiguredLabels, isTypeEnabled } from '@/lib/workflow';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { useUpdateTask } from '@/services/apis/tasks/use-tasks';
import type { EpicSummary, Project, Sprint, Task } from '@/types';
import { DueDateChip, PriorityIndicator, TaskTypeGlyph, UserChip } from '@/components/employee-component/tasks/sections/task-badges';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '@/components/employee-component/tasks/sections/task-config';
import { LabelSelect } from '@/components/employee-component/tasks/sections/label-select';
import { taskPath } from '@/components/employee-component/tasks/sections/task-link';
import { OnLeaveChip } from '@/components/employee-component/tasks/sections/leave-warning';
import { formatShortDate } from '@/components/employee-component/tasks/sections/task-utils';
import { DetailRow } from './detail-row';
import { InlineChips, InlineDate, InlineSelect, InlineText } from './inline-fields';
import type { SaveField } from './task-detail-meta';

const none = <span className="text-gray-400">None</span>;

const optional = (value: string) => (value && value !== TASK_FIELD_NONE ? value : undefined);

const PRIORITY_OPTIONS: Option[] = [...TASK_PRIORITIES].reverse().map((value) => {
  const { label, icon: Icon, className } = TASK_PRIORITY_CONFIG[value];
  return { value, label, icon: <Icon className={cn('h-4 w-4', className)} /> };
});

interface TaskDetailsSectionProps {
  task: Task;
  allTasks: Task[];
  user: PermissionUser;
  project?: Project;
  parent?: Task;
  epic?: EpicSummary;
  sprint?: Sprint;
  sprints: Sprint[];
  epics: EpicSummary[];
  // Router state that keeps the task list's filters on the way back
  keepListState: { from?: string };
  isProjectMember: boolean;
  canEdit: boolean;
  canReassign: boolean;
  canLogWork: boolean;
  saveField: SaveField;
  onLogWork: () => void;
}

// The collapsible Details card: every field edits in place
export function TaskDetailsSection({
  task,
  allTasks,
  user,
  project,
  parent,
  epic,
  sprint,
  sprints,
  epics,
  keepListState,
  isProjectMember,
  canEdit,
  canReassign,
  canLogWork,
  saveField,
  onLogWork,
}: TaskDetailsSectionProps) {
  const updateTask = useUpdateTask();
  const [detailsOpen, setDetailsOpen] = useState(true);

  /* ---------- Options for the editable fields ---------- */

  const withCurrent = (ids: string[], currentId: string) => (ids.includes(currentId) ? ids : [currentId, ...ids]);
  const personOptions = (ids: string[]): Option[] =>
    ids.map((id) => getUserById(id)).filter((member) => !!member).map((member) => ({
      value: member.id,
      label: member.id === user.id ? `${member.name} (me)` : member.name,
      hint: member.designation,
    }));
  const projectTeammates = isProjectMember ? (project?.memberIds ?? []).filter((id) => getActiveUsers().some((member) => member.id === id)) : [];
  const assigneeOptions = personOptions(withCurrent([...new Set([...getAssignableUsers(user).map((member) => member.id), ...projectTeammates])], task.assigneeId));
  const reporterOptions = personOptions(withCurrent(getActiveUsers().map((member) => member.id), task.reporterId));
  const watcherOptions = personOptions(getActiveUsers().map((member) => member.id));
  // Configured labels first, plus any label already used on a task
  const labelOptions = [...new Set([...getConfiguredLabels(), ...allTasks.flatMap((item) => item.labels)])];
  const typeOptions: Option[] = TASK_ISSUE_TYPES.filter((value) => value === task.type || (value !== 'sub-task' && !task.parentId && isTypeEnabled(value))).map((value) => ({
    value,
    label: TASK_TYPE_CONFIG[value].label,
    icon: <TaskTypeGlyph type={value} />,
  }));
  const sprintOptions: Option[] = [
    { value: TASK_FIELD_NONE, label: 'Backlog (no sprint)' },
    ...sprints
      .filter((item) => item.projectId === task.projectId && (item.status !== 'completed' || item.id === task.sprintId))
      .map((item) => ({ value: item.id, label: item.name, hint: `${item.status === 'active' ? 'Active' : item.status === 'planned' ? 'Planned' : 'Completed'} · ${formatShortDate(item.startDate)} – ${formatShortDate(item.endDate)}` })),
  ];
  const epicOptions: Option[] = [
    { value: TASK_FIELD_NONE, label: 'No epic' },
    ...epics
      .filter((item) => item.projectId === task.projectId && item.id !== task.id)
      .map((item) => ({ value: item.id, label: `${item.key} · ${item.title}`, icon: <TaskTypeGlyph type="epic" /> })),
  ];
  const canAssignToMe = task.assigneeId !== user.id && canEdit && can(user, 'task.assign', { ...task, assigneeId: user.id });

  const assignToMe = () =>
    updateTask.mutate({
      id: task.id,
      input: {
        type: task.type,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigneeId: user.id,
        startDate: task.startDate,
        dueDate: task.dueDate,
        labels: task.labels,
        epicId: task.epicId,
        sprintId: task.sprintId,
        estimateHours: task.estimateHours,
        attachments: task.attachments,
      },
    });

  const loggedPercent = task.estimateHours ? Math.min(100, Math.round((task.loggedHours / task.estimateHours) * 100)) : 0;

  return (
    <Card>
      <button
        type="button"
        onClick={() => setDetailsOpen((current) => !current)}
        aria-expanded={detailsOpen}
        className="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-3 text-left text-base font-semibold text-gray-900"
      >
        {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        Details
      </button>
      {detailsOpen && (
        <CardContent className="px-5 py-2">
          <dl className="divide-y divide-gray-50">
            <DetailRow label="Assignee">
              <InlineSelect
                value={task.assigneeId}
                options={assigneeOptions}
                onChange={(assigneeId) => saveField('Assignee', { assigneeId })}
                editable={canReassign}
                ariaLabel="Assignee"
                display={<UserChip userId={task.assigneeId} />}
              />
              {canAssignToMe && (
                <button type="button" onClick={assignToMe} disabled={updateTask.isPending} className="mt-1 block text-sm font-medium text-[#464EB8] hover:underline">
                  Assign to me
                </button>
              )}
            </DetailRow>
            <DetailRow label="Reporter">
              <InlineSelect
                value={task.reporterId}
                options={reporterOptions}
                onChange={(reporterId) => saveField('Reporter', { reporterId })}
                editable={canEdit}
                ariaLabel="Reporter"
                display={<UserChip userId={task.reporterId} />}
              />
            </DetailRow>
            <DetailRow label="Labels">
              <LabelSelect
                value={task.labels}
                onChange={(labels) => saveField('Labels', { labels })}
                options={labelOptions}
                disabled={!canEdit}
                variant="inline"
                placeholder="None"
              />
            </DetailRow>
            <DetailRow label={parent ? 'Parent' : 'Epic'}>
              {parent ? (
                // Sub-tasks stay with the task they were created under
                <Link to={taskPath(parent.key)} state={keepListState} className="inline-flex items-center gap-1.5 hover:text-[#464EB8] hover:underline">
                  <TaskTypeGlyph type={parent.type} />
                  {parent.key} {parent.title}
                </Link>
              ) : task.type === 'epic' ? (
                <span className="text-gray-400">Epics can't belong to another epic</span>
              ) : (
                <InlineSelect
                  value={task.epicId ?? TASK_FIELD_NONE}
                  options={epicOptions}
                  onChange={(value) => saveField('Epic', { epicId: optional(value) })}
                  editable={canEdit}
                  ariaLabel="Epic"
                  display={
                    epic ? (
                      <span className="inline-flex items-center gap-1.5 text-purple-700">
                        <TaskTypeGlyph type="epic" />
                        {epic.key} {epic.title}
                      </span>
                    ) : (
                      none
                    )
                  }
                />
              )}
            </DetailRow>
            <DetailRow label="Sprint">
              {task.parentId ? (
                <span title="Sub-tasks move with their parent task">{sprint ? sprint.name : <span className="text-gray-400">Backlog</span>}</span>
              ) : (
                <InlineSelect
                  value={task.sprintId ?? TASK_FIELD_NONE}
                  options={sprintOptions}
                  onChange={(value) => saveField('Sprint', { sprintId: optional(value) })}
                  editable={canEdit}
                  ariaLabel="Sprint"
                  display={sprint ? sprint.name : <span className="text-gray-400">Backlog</span>}
                />
              )}
            </DetailRow>
            <DetailRow label="Priority">
              <InlineSelect
                value={task.priority}
                options={PRIORITY_OPTIONS}
                onChange={(priority) => saveField('Priority', { priority: priority as Task['priority'] })}
                editable={canEdit}
                ariaLabel="Priority"
                display={<PriorityIndicator priority={task.priority} />}
              />
            </DetailRow>
            <DetailRow label="Type">
              <InlineSelect
                value={task.type}
                options={typeOptions}
                onChange={(type) => saveField('Type', { type: type as Task['type'], epicId: type === 'epic' ? undefined : task.epicId })}
                editable={canEdit && typeOptions.length > 1}
                ariaLabel="Type"
                display={
                  <span className="inline-flex items-center gap-1.5">
                    <TaskTypeGlyph type={task.type} />
                    {TASK_TYPE_CONFIG[task.type].label}
                  </span>
                }
              />
            </DetailRow>
            <DetailRow label="Start date">
              <InlineDate
                value={task.startDate}
                onChange={(startDate) => saveField('Start date', { startDate: startDate || undefined })}
                max={task.dueDate}
                editable={canEdit}
                ariaLabel="Start date"
                display={task.startDate ? formatShortDate(task.startDate) : none}
              />
            </DetailRow>
            <DetailRow label="Due date">
              <span className="flex flex-col items-start gap-1">
                {canEdit ? (
                  <InlineDate
                    value={task.dueDate}
                    onChange={(dueDate) => dueDate && saveField('Due date', { dueDate })}
                    min={task.startDate}
                    clearable={false}
                    editable
                    ariaLabel="Due date"
                    display={<DueDateChip task={task} />}
                  />
                ) : (
                  <DueDateChip task={task} />
                )}
                <OnLeaveChip userId={task.assigneeId} date={task.dueDate} hidden={task.status === 'done'} />
              </span>
            </DetailRow>
            {task.subjectId && (
              <DetailRow label="Employee">
                <UserChip userId={task.subjectId} />
              </DetailRow>
            )}
            <DetailRow label="Estimate">
              <InlineText
                value={task.estimateHours?.toString() ?? ''}
                onSave={(value) => saveField('Estimate', { estimateHours: value ? Number(value) : undefined })}
                editable={canEdit}
                ariaLabel="Estimate in hours"
                placeholder="e.g. 8"
                inputMode="decimal"
                display={task.estimateHours !== undefined ? `${task.estimateHours}h` : <span className="text-gray-400">Not estimated</span>}
                validate={(value) => (value && !(Number(value) >= 0 && Number(value) <= 1000) ? 'Enter hours between 0 and 1000' : undefined)}
              />
            </DetailRow>
            <DetailRow label="Time tracking">
              {task.estimateHours !== undefined || task.loggedHours > 0 ? (
                <div className="space-y-1">
                  <p>
                    {task.loggedHours}h logged{task.estimateHours !== undefined && ` of ${task.estimateHours}h`}
                  </p>
                  {task.estimateHours !== undefined && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn('h-full rounded-full', task.loggedHours > task.estimateHours ? 'bg-red-500' : 'bg-[#464EB8]')}
                        style={{ width: `${loggedPercent}%` }}
                      />
                    </div>
                  )}
                  {canLogWork && (
                    <button type="button" onClick={onLogWork} className="text-sm font-medium text-[#464EB8] hover:underline">
                      Log work
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">No time logged</span>
              )}
            </DetailRow>
            <DetailRow label="Watchers">
              <InlineChips
                values={task.watcherIds}
                onChange={(watcherIds) => saveField('Watchers', { watcherIds })}
                editable={canEdit}
                ariaLabel="Watcher"
                options={watcherOptions}
                renderChip={(id) => <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">{getUserById(id)?.name ?? 'Unknown user'}</span>}
              />
            </DetailRow>
          </dl>
        </CardContent>
      )}
    </Card>
  );
}
