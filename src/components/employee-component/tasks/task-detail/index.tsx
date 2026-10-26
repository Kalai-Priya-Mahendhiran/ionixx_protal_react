import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { can, canAssignWithinProject, hasProjectAccess, type PermissionUser } from '@/lib/permissions/task-permissions';
import { ROUTES } from '@/lib/constants';
import { getActiveUsers } from '@/lib/user-directory';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { useDeleteTask, useEpics, useProjects, useSprints, useTasks, useUpdateTaskField } from '@/services/apis/tasks/use-tasks';
import type { TaskUpdateInput } from '@/services/apis/tasks/task-service';
import type { Task } from '@/types';
import { TaskFormDialog } from '../sections';
import { FlagBlockedDialog } from '../sections/flag-blocked-dialog';
import { LogWorkDialog } from '../sections/log-work-dialog';
import { TaskActivitySection, type MentionCandidate } from '../sections/task-activity';
import { taskPath } from '../sections/task-link';
import { TaskSubtasks } from '../sections/task-subtasks';
import { ShortcutsDialog } from '../sections/shortcuts-dialog';
import { toUpdateInput } from '../sections/task-utils';
import { useTaskSettings } from '@/services/apis/settings/use-task-settings';
import {
  AttachmentsSection,
  DescriptionSection,
  ProjectAccessSection,
  StatusSection,
  TaskDetailsSection,
  TaskHeaderSection,
  TaskTitleSection,
} from './sections';

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
          <ProjectAccessSection project={keyProject} user={user} backTo={backTo} />
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
  const updateField = useUpdateTaskField();
  const [logWorkOpen, setLogWorkOpen] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);

  const parent = task.parentId ? allTasks.find((item) => item.id === task.parentId) : undefined;
  const subtasks = allTasks.filter((item) => item.parentId === task.id);
  const project = projects.find((item) => item.id === task.projectId);
  const sprint = sprints.find((item) => item.id === task.sprintId);
  const epic = epics.find((item) => item.id === task.epicId);

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

  return (
    <div className="space-y-5">
      <TaskHeaderSection
        task={task}
        user={user}
        project={project}
        epic={epic}
        parent={parent}
        backTo={backTo}
        keepListState={keepListState}
        canWatch={canWatch}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <Card className="min-w-0">
          <CardContent className="space-y-7 p-6">
            <TaskTitleSection
              task={task}
              canEdit={canEdit}
              canChangeStatus={canChangeStatus}
              canLogWork={canLogWork}
              isBlocked={isBlocked}
              saveField={saveField}
              onLogWork={() => setLogWorkOpen(true)}
              onFlag={() => setFlagOpen(true)}
            />

            <DescriptionSection task={task} canEdit={canEdit} saveField={saveField} />

            {!task.parentId && (
              <TaskSubtasks parent={task} subtasks={subtasks} onOpen={(subtask) => navigate(taskPath(subtask.key), { state: keepListState })} />
            )}

            <AttachmentsSection task={task} canEdit={canEdit} />

            <TaskActivitySection task={task} mentionable={mentionable} canComment={can(user, 'task.comment', task) || isProjectMember} />
          </CardContent>
        </Card>

        {/* Side column */}
        <aside className="space-y-4">
          <StatusSection task={task} user={user} canChangeStatus={canChangeStatus} />

          <TaskDetailsSection
            task={task}
            allTasks={allTasks}
            user={user}
            project={project}
            parent={parent}
            epic={epic}
            sprint={sprint}
            sprints={sprints}
            epics={epics}
            keepListState={keepListState}
            isProjectMember={isProjectMember}
            canEdit={canEdit}
            canReassign={canReassign}
            canLogWork={canLogWork}
            saveField={saveField}
            onLogWork={() => setLogWorkOpen(true)}
          />

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
