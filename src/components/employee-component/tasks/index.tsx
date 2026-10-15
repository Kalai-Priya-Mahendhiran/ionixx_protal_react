import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { can, isTaskReadOnly, resolveTaskView, type PermissionUser } from '@/lib/permissions/task-permissions';
import { useDeleteTask, useProjects, useTasks } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import {
  TaskBoardSection,
  TaskFiltersSection,
  TaskFormDialog,
  TaskListSection,
  TaskStates,
  TaskStatsSection,
  TaskTabs,
  type TaskLayout,
} from './sections';
import { TASK_VIEW_META } from './sections/task-config';
import { taskPath } from './sections/task-link';
import {
  MY_TASKS_TABS,
  countByStatusFilter,
  filterTasksForView,
  getSubtaskProgress,
  isMyTasksTab,
  matchesMyTasksTab,
  matchesSearch,
  matchesStatusFilter,
  type MyTasksTab,
  type TaskStatusFilter,
} from './sections/task-utils';

// The task is kept while the dialog closes so its title doesn't flicker
type FormState = { open: boolean; task?: Task };

function TasksPage({ user }: { user: PermissionUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const view = resolveTaskView(user, requestedView);

  const updateParams = (changes: Record<string, string | null>, replace = false) =>
    setSearchParams(
      (params) => {
        Object.entries(changes).forEach(([key, value]) => (value === null ? params.delete(key) : params.set(key, value)));
        return params;
      },
      { replace },
    );

  // Keep ?view= in the URL in sync with the role's default (or a corrected invalid value)
  useEffect(() => {
    if (requestedView !== view) updateParams({ view }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateParams is recreated every render
  }, [requestedView, view]);

  // Board is the default; ?layout=list is kept in the URL so the choice can be shared
  const layout: TaskLayout = searchParams.get('layout') === 'list' ? 'list' : 'board';
  const requestedTab = searchParams.get('tab');
  const tab: MyTasksTab = isMyTasksTab(requestedTab) ? requestedTab : 'assigned';
  const legacyTaskKey = searchParams.get('task');
  const navigate = useNavigate();
  const location = useLocation();

  const { data: tasks = [], isLoading, isError, refetch } = useTasks();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const showTabs = view === 'my-tasks';
  const viewTasks = useMemo(() => filterTasksForView(view, tasks, user.id), [view, tasks, user.id]);
  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        MY_TASKS_TABS.map(({ value }) => [value, viewTasks.filter((task) => matchesMyTasksTab(task, value, user.id)).length]),
      ) as Record<MyTasksTab, number>,
    [viewTasks, user.id],
  );
  const scopedTasks = useMemo(
    () => (showTabs ? viewTasks.filter((task) => matchesMyTasksTab(task, tab, user.id)) : viewTasks),
    [showTabs, viewTasks, tab, user.id],
  );
  const counts = useMemo(() => countByStatusFilter(scopedTasks), [scopedTasks]);
  const subtaskProgress = useMemo(() => getSubtaskProgress(tasks), [tasks]);
  const visibleTasks = scopedTasks.filter((task) => matchesStatusFilter(task, statusFilter) && matchesSearch(task, searchTerm));

  // Links from before tasks had their own page (?task=IXP-102) go to /tasks/IXP-102
  useEffect(() => {
    if (legacyTaskKey) navigate(taskPath(legacyTaskKey), { replace: true });
  }, [legacyTaskKey, navigate]);

  const canCreate = can(user, 'task.create');
  const readOnly = isTaskReadOnly(user);
  const { title, description } = TASK_VIEW_META[view];

  const openCreate = () => setFormState({ open: true, task: undefined });
  const openEdit = (task: Task) => setFormState({ open: true, task });
  // The task page links back here with the same view, tab, layout and filters
  const showTask = (task: Task) => navigate(taskPath(task.key), { state: { from: location.search } });
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  const taskToDeleteSubtasks = taskToDelete ? tasks.filter((task) => task.parentId === taskToDelete.id).length : 0;
  const confirmDelete = () => {
    if (!taskToDelete) return;
    deleteTask.mutate(taskToDelete, { onSettled: () => setTaskToDelete(null) });
  };

  return (
    <MainLayout>
      {/* Extra width so four board columns or the list table fit side by side */}
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {readOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  <Eye className="h-3.5 w-3.5" />
                  Read only
                </span>
              )}
            </div>
            <p className="mt-2 text-gray-600">{description}</p>
          </div>
          {canCreate && (
            <Button onClick={openCreate} className="flex items-center gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </Button>
          )}
        </div>

        {showTabs && <TaskTabs active={tab} counts={tabCounts} onChange={(next) => updateParams({ tab: next })} />}

        <TaskStatsSection counts={counts} activeFilter={statusFilter} isLoading={isLoading} onSelect={setStatusFilter} />

        <TaskFiltersSection
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          layout={layout}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onLayoutChange={(next) => updateParams({ layout: next })}
        />

        {isLoading || isError || visibleTasks.length === 0 ? (
          <TaskStates
            layout={layout}
            isLoading={isLoading}
            isError={isError}
            isFiltered={scopedTasks.length > 0}
            onRetry={() => refetch()}
            onClearFilters={clearFilters}
            onCreate={canCreate ? openCreate : undefined}
          />
        ) : layout === 'board' ? (
          <TaskBoardSection
            tasks={visibleTasks}
            subtaskProgress={subtaskProgress}
            onCreate={canCreate ? openCreate : undefined}
            onOpen={showTask}
            onEdit={openEdit}
            onDelete={setTaskToDelete}
          />
        ) : (
          <TaskListSection tasks={visibleTasks} subtaskProgress={subtaskProgress} onEdit={openEdit} onDelete={setTaskToDelete} />
        )}
      </div>

      <TaskFormDialog
        open={formState.open}
        task={formState.task}
        projects={projects}
        onOpenChange={(open) => !open && setFormState((current) => ({ ...current, open: false }))}
      />

      <ConfirmDialog
        open={!!taskToDelete}
        title={`Delete ${taskToDelete?.key ?? 'task'}?`}
        description={
          <>
            <span className="font-medium text-gray-900">{taskToDelete?.title}</span>
            {taskToDeleteSubtasks > 0 && ` and its ${taskToDeleteSubtasks} sub-task${taskToDeleteSubtasks === 1 ? '' : 's'}`} will be
            permanently removed. This can't be undone.
          </>
        }
        confirmLabel="Delete task"
        destructive
        loading={deleteTask.isPending}
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      />
    </MainLayout>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  // ProtectedRoute guarantees a signed-in user; this guard just narrows the type
  if (!user) return null;
  return <TasksPage user={user} />;
}
