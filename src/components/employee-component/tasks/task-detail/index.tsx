import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, ChevronDown, ChevronRight, Clock, Eye, EyeOff, Hourglass, Lock, Pencil, SearchX, Share2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Option } from '@/components/ui/form-fields';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { can, canAssignWithinProject, canTransition, getAssignableUsers, hasProjectAccess, type PermissionUser } from '@/lib/permissions/task-permissions';
import { ROUTES } from '@/lib/constants';
import { TASK_FIELD_NONE, TASK_ISSUE_TYPES, TASK_PRIORITIES } from '@/lib/schemas';
import { getConfiguredLabels, getWorkflowStatuses, isTypeEnabled } from '@/lib/workflow';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import {
  useAddAttachments,
  useChangeTaskStatus,
  useDeleteTask,
  useEpics,
  useJoinProject,
  useProjects,
  useRemoveAttachment,
  useRequestProjectAccess,
  useSetBlocked,
  useSetWatching,
  useSprints,
  useTasks,
  useUpdateTask,
  useUpdateTaskField,
} from '@/services/apis/tasks/use-tasks';
import type { TaskUpdateInput } from '@/services/apis/tasks/task-service';
import type { Project, Task, TaskStatus } from '@/types';
import { TaskFormDialog } from '../sections';
import { FlagBlockedDialog } from '../sections/flag-blocked-dialog';
import { LogWorkDialog } from '../sections/log-work-dialog';
import { TaskActionsMenu } from '../sections/task-actions-menu';
import { TaskActivitySection, type MentionCandidate } from '../sections/task-activity';
import { AttachmentDropzone, AttachmentList } from '../sections/task-attachments-field';
import { DueDateChip, PriorityIndicator, TaskTypeGlyph, UserChip } from '../sections/task-badges';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG, getStatusMeta } from '../sections/task-config';
import { InlineChips, InlineDate, InlineSelect, InlineText, InlineTextarea } from './inline-fields';
import { LabelSelect } from '../sections/label-select';
import { copyTaskLink, taskPath } from '../sections/task-link';
import { TaskSubtasks } from '../sections/task-subtasks';
import { OnLeaveBanner, OnLeaveChip } from '../sections/leave-warning';
import { ShortcutsDialog } from '../sections/shortcuts-dialog';
import { formatShortDate, toUpdateInput } from '../sections/task-utils';
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

const optional = (value: string) => (value && value !== TASK_FIELD_NONE ? value : undefined);

const PRIORITY_OPTIONS: Option[] = [...TASK_PRIORITIES].reverse().map((value) => {
  const { label, icon: Icon, className } = TASK_PRIORITY_CONFIG[value];
  return { value, label, icon: <Icon className={cn('h-4 w-4', className)} /> };
});

/* ---------- No access to the task's project ---------- */

// A shared link to a project the person isn't on: open projects can be joined, closed ones take a request
function ProjectAccessCard({ project, user, backTo }: { project: Project; user: PermissionUser; backTo: string }) {
  const location = useLocation();
  const joinProject = useJoinProject();
  const requestAccess = useRequestProjectAccess();
  const pending = (project.pendingMemberIds ?? []).includes(user.id);

  return (
    <Card>
      <CardContent className="mx-auto max-w-lg p-12 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 className="mb-2 text-lg font-medium text-gray-900">You don't have access to {project.name}</h1>
        <p className="mb-5 text-gray-600">
          {project.openMembership
            ? 'Anyone can join this project. Join it to open this task and the rest of its work.'
            : pending
              ? 'Your request to join is waiting for a System Admin. You will be notified when it is reviewed.'
              : 'This link is for members of the project. Ask to join and a System Admin will review your request.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to={backTo}>Back to tasks</Link>
          </Button>
          {project.openMembership ? (
            <Button onClick={() => joinProject.mutate(project)} disabled={joinProject.isPending} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <UserPlus className="h-4 w-4" />
              {joinProject.isPending ? 'Joining…' : 'Join project'}
            </Button>
          ) : pending ? (
            <Button disabled variant="outline" className="gap-2">
              <Hourglass className="h-4 w-4" />
              Request pending
            </Button>
          ) : (
            <Button
              onClick={() => requestAccess.mutate({ project, link: location.pathname })}
              disabled={requestAccess.isPending}
              className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
            >
              <UserPlus className="h-4 w-4" />
              {requestAccess.isPending ? 'Sending…' : 'Request access'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

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
  // A key like IXP-102 names its project; people outside it are offered to join or ask for access
  const keyProject = projects.find((item) => item.key === taskKey.split('-')[0]?.toUpperCase());
  const lacksProjectAccess = !task && !movedTo && !!keyProject && !hasProjectAccess(user, keyProject);

  // Keyboard: E edits (when allowed) · ? lists the shortcuts
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const canEditTask = !!task && can(user, 'task.edit', task);
  useKeyboardShortcuts({ e: canEditTask ? () => setEditOpen(true) : undefined, '?': () => setShortcutsOpen(true) });

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
        ) : !task && movedTo ? null : lacksProjectAccess && keyProject ? (
          <ProjectAccessCard project={keyProject} user={user} backTo={backTo} />
        ) : !task ? (
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

      <ShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={[...(canEditTask ? [{ keys: 'E', label: 'Edit this task' }] : []), { keys: '?', label: 'Show these shortcuts' }]}
      />

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

  const updateField = useUpdateTaskField();
  const isProjectMember = !!project?.memberIds.includes(user.id);
  const canEdit = can(user, 'task.edit', task);
  const canChangeStatus = can(user, 'task.changeStatus', task);
  const canLogWork = can(user, 'task.logWork', task);
  // Project members can follow any task of their project
  const canWatch = can(user, 'task.watch', task) || isProjectMember;
  // Managers assign within their scope; project members can also hand work to teammates on the project
  const canReassign = canEdit && (can(user, 'task.assign') || isProjectMember);

  // Inline edits save one field at a time, checked like the Edit dialog would
  const saveField = (label: string, patch: Partial<TaskUpdateInput>) => {
    const input = { ...toUpdateInput(task), ...patch };
    const handOver = !!patch.assigneeId && canAssignWithinProject(user, task, patch.assigneeId, project);
    if (!handOver && !can(user, 'task.edit', { ...task, ...input })) {
      toast.error("You don't have permission to save the task with that change");
      return;
    }
    updateField.mutate({ id: task.id, input }, { onSuccess: () => toast.success(`${label} updated`) });
  };

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
  const isWatching = task.watcherIds.includes(user.id);
  const isBlocked = task.isBlocked && task.status !== 'done';
  const keepListState = { from: (location.state as { from?: string } | null)?.from };

  // People involved come first in the @mention picker, tagged with their part in the task
  const mentionable = useMemo<MentionCandidate[]>(() => {
    const tags = new Map<string, string>();
    task.watcherIds.forEach((id) => tags.set(id, 'Watcher'));
    tags.set(task.reporterId, 'Reporter');
    tags.set(task.assigneeId, 'Assignee');
    return getActiveUsers()
      .filter((member) => can(member, 'task.view', task) || (!!parent && can(member, 'task.view', parent)) || !!project?.memberIds.includes(member.id))
      .map((member) => ({ member, tag: tags.get(member.id) }))
      .sort((a, b) => Number(!!b.tag) - Number(!!a.tag));
  }, [task, parent, project]);

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
            <Button variant="outline" size="sm" onClick={onEdit} title="Edit (E)" aria-keyshortcuts="e" className="gap-1.5">
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
              <h1 className="text-2xl font-semibold leading-tight text-gray-900">
                <InlineText
                  value={task.title}
                  onSave={(title) => saveField('Title', { title })}
                  editable={canEdit}
                  ariaLabel="Title"
                  maxLength={200}
                  inputClassName="h-11 text-xl font-semibold"
                  validate={(value) => (value ? undefined : 'Give the task a title')}
                />
              </h1>

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
              <InlineTextarea
                value={task.description}
                onSave={(description) => saveField('Description', { description })}
                editable={canEdit}
                ariaLabel="Description"
                placeholder="Context, steps to reproduce or acceptance criteria"
                emptyText={canEdit ? 'Add a description…' : 'No description.'}
              />
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

            <TaskActivitySection task={task} mentionable={mentionable} canComment={can(user, 'task.comment', task) || isProjectMember} />
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
                          <button type="button" onClick={() => setLogWorkOpen(true)} className="text-sm font-medium text-[#464EB8] hover:underline">
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
