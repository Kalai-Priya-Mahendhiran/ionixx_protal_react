import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ChevronDown, ChevronRight, Clock, Eye, EyeOff, Pencil, SearchX, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { can, canTransition, type PermissionUser } from '@/lib/permissions/task-permissions';
import { ROUTES } from '@/lib/constants';
import { getWorkflowStatuses } from '@/lib/workflow';
import { USER_DIRECTORY, getUserById } from '@/lib/user-directory';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import {
  useAddAttachments,
  useChangeTaskStatus,
  useDeleteTask,
  useEpics,
  useProjects,
  useRemoveAttachment,
  useSetBlocked,
  useSetWatching,
  useSprints,
  useTasks,
  useUpdateTask,
} from '@/services/apis/tasks/use-tasks';
import type { Task, TaskStatus } from '@/types';
import { TaskFormDialog } from '../sections';
import { FlagBlockedDialog } from '../sections/flag-blocked-dialog';
import { LogWorkDialog } from '../sections/log-work-dialog';
import { TaskActionsMenu } from '../sections/task-actions-menu';
import { TaskActivitySection, type MentionCandidate } from '../sections/task-activity';
import { AttachmentDropzone, AttachmentList } from '../sections/task-attachments-field';
import { DueDateChip, PriorityIndicator, TaskTypeGlyph, UserChip } from '../sections/task-badges';
import { TASK_TYPE_CONFIG, getLabelColor, getStatusMeta } from '../sections/task-config';
import { copyTaskLink, taskPath } from '../sections/task-link';
import { TaskSubtasks } from '../sections/task-subtasks';
import { OnLeaveBanner, OnLeaveChip } from '../sections/leave-warning';
import { formatShortDate } from '../sections/task-utils';
import { useTaskSettings } from '@/services/apis/settings/use-task-settings';

/* ---------- Small building blocks ---------- */

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 py-2.5 text-sm">
      <dt className="pt-0.5 text-gray-500">{label}</dt>
      <dd className="min-w-0 text-gray-800">{children}</dd>
    </div>
  );
}

const none = <span className="text-gray-400">None</span>;

function CollapsibleSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="-ml-1 flex items-center gap-1 rounded px-1 text-base font-semibold text-gray-900 hover:bg-gray-100"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {title}
      </button>
      {open && children}
    </section>
  );
}

/* ---------- Page ---------- */

export default function TaskDetailPage() {
  const { user } = useAuth();
  // ProtectedRoute guarantees a signed-in user; this guard just narrows the type
  if (!user) return null;
  return <TaskDetailContent user={user} />;
}

function TaskDetailContent({ user }: { user: PermissionUser }) {
  const { taskKey = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: tasks = [], isLoading, isError, refetch } = useTasks();
  // Redraws after a settings save (statuses, labels, permissions)
  useTaskSettings();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Coming from the task list keeps its filters, view and layout on the way back
  const backTo = `${ROUTES.Tasks}${(location.state as { from?: string } | null)?.from ?? ''}`;
  const task = tasks.find((item) => item.key.toLowerCase() === taskKey.toLowerCase());
  // Tasks moved to another project get a new key; old links forward to it
  const movedTo = task ? undefined : tasks.find((item) => item.previousKeys?.some((key) => key.toLowerCase() === taskKey.toLowerCase()));
  useEffect(() => {
    if (!movedTo) return;
    toast.info(`${taskKey.toUpperCase()} is now ${movedTo.key}`);
    navigate(taskPath(movedTo.key), { replace: true, state: location.state });
  }, [movedTo, taskKey, navigate, location.state]);

  const subtaskCount = task ? tasks.filter((item) => item.parentId === task.id).length : 0;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        {isLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading task">
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
              <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />
            </div>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="mb-4 text-gray-700">Couldn't load this task.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : !task && movedTo ? null : !task ? (
          <Card>
            <CardContent className="p-12 text-center">
              <SearchX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h1 className="mb-2 text-lg font-medium text-gray-900">{taskKey.toUpperCase()} isn't available</h1>
              <p className="mb-4 text-gray-600">It may have been deleted, or you don't have access to it.</p>
              <Button asChild variant="outline">
                <Link to={backTo}>Back to tasks</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TaskDetailView
            key={task.id}
            task={task}
            allTasks={tasks}
            user={user}
            backTo={backTo}
            onEdit={() => setEditOpen(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        )}
      </div>

      {task && (
        <>
          <TaskFormDialog open={editOpen} task={task} projects={projects} onOpenChange={setEditOpen} />
          <ConfirmDialog
            open={confirmDelete}
            title={`Delete ${task.key}?`}
            description={
              <>
                <span className="font-medium text-gray-900">{task.title}</span>
                {subtaskCount > 0 && ` and its ${subtaskCount} sub-task${subtaskCount === 1 ? '' : 's'}`} will be permanently removed.
                This can't be undone.
              </>
            }
            confirmLabel="Delete task"
            destructive
            loading={deleteTask.isPending}
            onConfirm={() => deleteTask.mutate(task, { onSuccess: () => navigate(backTo, { replace: true }), onSettled: () => setConfirmDelete(false) })}
            onOpenChange={setConfirmDelete}
          />
        </>
      )}
    </MainLayout>
  );
}

interface TaskDetailViewProps {
  task: Task;
  allTasks: Task[];
  user: PermissionUser;
  backTo: string;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskDetailView({ task, allTasks, user, backTo, onEdit, onDelete }: TaskDetailViewProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: sprints = [] } = useSprints();
  const { data: epics = [] } = useEpics();
  const changeStatus = useChangeTaskStatus();
  const updateTask = useUpdateTask();
  const setWatching = useSetWatching();
  const setBlocked = useSetBlocked();
  const addAttachments = useAddAttachments();
  const removeAttachment = useRemoveAttachment();
  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);

  const parent = task.parentId ? allTasks.find((item) => item.id === task.parentId) : undefined;
  const subtasks = allTasks.filter((item) => item.parentId === task.id);
  const project = projects.find((item) => item.id === task.projectId);
  const sprint = sprints.find((item) => item.id === task.sprintId);
  const epic = epics.find((item) => item.id === task.epicId);

  const canEdit = can(user, 'task.edit', task);
  const canChangeStatus = can(user, 'task.changeStatus', task);
  const canLogWork = can(user, 'task.logWork', task);
  const canWatch = can(user, 'task.watch', task);
  const canAssignToMe = task.assigneeId !== user.id && canEdit && can(user, 'task.assign', { ...task, assigneeId: user.id });
  const isWatching = task.watcherIds.includes(user.id);
  const isBlocked = task.isBlocked && task.status !== 'done';
  const keepListState = { from: (location.state as { from?: string } | null)?.from };

  // People involved come first in the @mention picker, tagged with their part in the task
  const mentionable = useMemo<MentionCandidate[]>(() => {
    const tags = new Map<string, string>();
    task.watcherIds.forEach((id) => tags.set(id, 'Watcher'));
    tags.set(task.reporterId, 'Reporter');
    tags.set(task.assigneeId, 'Assignee');
    return USER_DIRECTORY.filter((member) => can(member, 'task.view', task) || (!!parent && can(member, 'task.view', parent)))
      .map((member) => ({ member, tag: tags.get(member.id) }))
      .sort((a, b) => Number(!!b.tag) - Number(!!a.tag));
  }, [task, parent]);

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
    <div className="space-y-5">
      {/* Breadcrumb + header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm text-gray-500">
          <Link to={backTo} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Tasks
          </Link>
          {project && (
            <>
              <span>/</span>
              <span>{project.name}</span>
            </>
          )}
          {epic && !parent && (
            <>
              <span>/</span>
              <Link to={taskPath(epic.key)} state={keepListState} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
                <TaskTypeGlyph type="epic" />
                {epic.key}
              </Link>
            </>
          )}
          {parent && (
            <>
              <span>/</span>
              <Link to={taskPath(parent.key)} state={keepListState} className="inline-flex items-center gap-1 hover:text-[#464EB8] hover:underline">
                <TaskTypeGlyph type={parent.type} />
                {parent.key}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
            <TaskTypeGlyph type={task.type} />
            {task.key}
          </span>
        </nav>

        <div className="flex items-center gap-1.5">
          {canWatch && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWatching.mutate({ task, watching: !isWatching })}
              disabled={setWatching.isPending}
              aria-pressed={isWatching}
              title={isWatching ? 'Stop watching' : 'Watch this task to get notified about changes'}
              className={cn('gap-1.5', isWatching && 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]')}
            >
              {isWatching ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isWatching ? 'Watching' : 'Watch'}
              <span className="rounded-full bg-white px-1.5 text-xs text-gray-600">{task.watcherIds.length}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void copyTaskLink(task)} className="gap-1.5" title="Copy a link to share with your team">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
          <TaskActionsMenu task={task} onDelete={onDelete} triggerClassName="h-9 w-9 border border-input p-0" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <Card className="min-w-0">
          <CardContent className="space-y-7 p-6">
            <div className="space-y-4">
              <h1 className="text-2xl font-semibold leading-tight text-gray-900">{task.title}</h1>

              <OnLeaveBanner userId={task.assigneeId} date={task.dueDate} hidden={task.status === 'done'} />

              {isBlocked && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
                  <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">Blocked</p>
                    {task.blockedReason && <p className="text-red-700">{task.blockedReason}</p>}
                  </div>
                  {canChangeStatus && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBlocked.mutate({ task, blocked: false })}
                      disabled={setBlocked.isPending}
                      className="border-red-200 bg-white text-red-700 hover:bg-red-100"
                    >
                      Remove flag
                    </Button>
                  )}
                </div>
              )}

              {(canLogWork || (canChangeStatus && !isBlocked && task.status !== 'done')) && (
                <div className="flex flex-wrap gap-2">
                  {canLogWork && (
                    <Button size="sm" variant="outline" onClick={() => setLogWorkOpen(true)} className="gap-1.5">
                      <Clock className="h-4 w-4" />
                      Log work
                    </Button>
                  )}
                  {canChangeStatus && !isBlocked && task.status !== 'done' && (
                    <Button size="sm" variant="outline" onClick={() => setFlagOpen(true)} className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800">
                      <Ban className="h-4 w-4" />
                      Flag as blocked / Request help
                    </Button>
                  )}
                </div>
              )}
            </div>

            <CollapsibleSection title="Description">
              {task.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{task.description}</p>
              ) : (
                <p className="text-sm text-gray-400">{canEdit ? 'No description yet — use Edit to add one.' : 'No description.'}</p>
              )}
            </CollapsibleSection>

            {!task.parentId && (
              <TaskSubtasks parent={task} subtasks={subtasks} onOpen={(subtask) => navigate(taskPath(subtask.key), { state: keepListState })} />
            )}

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-gray-900">
                Attachments {task.attachments.length > 0 && <span className="font-normal text-gray-500">({task.attachments.length})</span>}
              </h2>
              <AttachmentList
                attachments={task.attachments}
                onRemove={canEdit ? (attachment) => removeAttachment.mutate({ task, attachmentId: attachment.id }) : undefined}
              />
              {canEdit ? (
                <AttachmentDropzone compact taskId={task.id} onUploaded={(attachments) => addAttachments.mutate({ task, attachments })} />
              ) : (
                task.attachments.length === 0 && <p className="text-sm text-gray-400">No attachments.</p>
              )}
            </section>

            <TaskActivitySection task={task} mentionable={mentionable} />
          </CardContent>
        </Card>

        {/* Side column */}
        <aside className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={task.status} disabled={!canChangeStatus} onValueChange={(status) => changeStatus.mutate({ task, status: status as TaskStatus })}>
              <SelectTrigger aria-label="Status" className={cn('h-10 w-44 font-semibold', getStatusMeta(task.status).className)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getWorkflowStatuses().map(({ id: status }) => (
                  <SelectItem key={status} value={status} disabled={status !== task.status && !canTransition(user, task, status)}>
                    {getStatusMeta(status).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canChangeStatus && task.status === 'in-review' && !canTransition(user, task, 'done') && (
              <p className="text-xs text-gray-500">Waiting for a manager to approve.</p>
            )}
          </div>

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
                    <UserChip userId={task.assigneeId} />
                    {canAssignToMe && (
                      <button type="button" onClick={assignToMe} disabled={updateTask.isPending} className="mt-1 block text-sm font-medium text-[#464EB8] hover:underline">
                        Assign to me
                      </button>
                    )}
                  </DetailRow>
                  <DetailRow label="Reporter">
                    <UserChip userId={task.reporterId} />
                  </DetailRow>
                  <DetailRow label="Labels">
                    {task.labels.length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {task.labels.map((label) => (
                          <span key={label} className={cn('rounded px-1.5 py-0.5 text-xs font-medium', getLabelColor(label))}>
                            {label}
                          </span>
                        ))}
                      </span>
                    ) : (
                      none
                    )}
                  </DetailRow>
                  <DetailRow label="Parent">
                    {parent ? (
                      <Link to={taskPath(parent.key)} state={keepListState} className="inline-flex items-center gap-1.5 hover:text-[#464EB8] hover:underline">
                        <TaskTypeGlyph type={parent.type} />
                        {parent.key} {parent.title}
                      </Link>
                    ) : epic ? (
                      <Link to={taskPath(epic.key)} state={keepListState} className="inline-flex items-center gap-1.5 text-purple-700 hover:underline">
                        <TaskTypeGlyph type="epic" />
                        {epic.key} {epic.title}
                      </Link>
                    ) : (
                      none
                    )}
                  </DetailRow>
                  <DetailRow label="Sprint">{sprint ? sprint.name : <span className="text-gray-400">Backlog</span>}</DetailRow>
                  <DetailRow label="Priority">
                    <PriorityIndicator priority={task.priority} />
                  </DetailRow>
                  <DetailRow label="Type">
                    <span className="inline-flex items-center gap-1.5">
                      <TaskTypeGlyph type={task.type} />
                      {TASK_TYPE_CONFIG[task.type].label}
                    </span>
                  </DetailRow>
                  <DetailRow label="Start date">{task.startDate ? formatShortDate(task.startDate) : none}</DetailRow>
                  <DetailRow label="Due date">
                    <span className="flex flex-col items-start gap-1">
                      <DueDateChip task={task} />
                      <OnLeaveChip userId={task.assigneeId} date={task.dueDate} hidden={task.status === 'done'} />
                    </span>
                  </DetailRow>
                  {task.subjectId && (
                    <DetailRow label="Employee">
                      <UserChip userId={task.subjectId} />
                    </DetailRow>
                  )}
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
                      </div>
                    ) : (
                      <span className="text-gray-400">No time logged</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Watchers">
                    {task.watcherIds.length > 0 ? task.watcherIds.map((id) => getUserById(id)?.name).filter(Boolean).join(', ') : none}
                  </DetailRow>
                </dl>
              </CardContent>
            )}
          </Card>

          <p className="px-1 text-xs text-gray-400" title={`Created ${formatDateTime(task.createdAt)} · Updated ${formatDateTime(task.updatedAt)}`}>
            Created {formatRelativeTime(task.createdAt)} · Updated {formatRelativeTime(task.updatedAt)}
          </p>
        </aside>
      </div>

      <LogWorkDialog task={task} open={logWorkOpen} onOpenChange={setLogWorkOpen} />
      <FlagBlockedDialog task={task} open={flagOpen} onOpenChange={setFlagOpen} />
    </div>
  );
}
