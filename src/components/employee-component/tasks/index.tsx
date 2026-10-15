import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { can, isTaskReadOnly, resolveTaskView, type PermissionUser } from '@/lib/permissions/task-permissions';
import { useDeleteTask, useProjects, useTasks } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { TaskBoardSection, TaskFiltersSection, TaskFormDialog, TaskListSection, TaskStates, TaskStatsSection, type TaskLayout } from './sections';
import { TASK_VIEW_META } from './sections/task-config';
import { countByStatusFilter, filterTasksForView, matchesSearch, matchesStatusFilter, type TaskStatusFilter } from './sections/task-utils';

// The task is kept while the dialog closes so its title doesn't flicker
type FormState = { open: boolean; task?: Task };

function TasksPage({ user }: { user: PermissionUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('view');
  const view = resolveTaskView(user, requestedView);

  // Keep ?view= in the URL in sync with the role's default (or a corrected invalid value)
  useEffect(() => {
    if (requestedView !== view) {
      setSearchParams((params) => {
        params.set('view', view);
        return params;
      }, { replace: true });
    }
  }, [requestedView, view, setSearchParams]);

  // Board is the default; ?layout=list is kept in the URL so the choice can be shared
  const layout: TaskLayout = searchParams.get('layout') === 'list' ? 'list' : 'board';
  const setLayout = (next: TaskLayout) =>
    setSearchParams((params) => {
      params.set('layout', next);
      return params;
    });

  const { data: tasks = [], isLoading, isError, refetch } = useTasks();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();

  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const viewTasks = useMemo(() => filterTasksForView(view, tasks, user.id), [view, tasks, user.id]);
  const counts = useMemo(() => countByStatusFilter(viewTasks), [viewTasks]);
  const visibleTasks = viewTasks.filter((task) => matchesStatusFilter(task, statusFilter) && matchesSearch(task, searchTerm));

  const canCreate = can(user, 'task.create');
  const readOnly = isTaskReadOnly(user);
  const { title, description } = TASK_VIEW_META[view];

  const openCreate = () => setFormState({ open: true, task: undefined });
  const openEdit = (task: Task) => setFormState({ open: true, task });
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  const confirmDelete = () => {
    if (!taskToDelete) return;
    deleteTask.mutate(taskToDelete, { onSettled: () => setTaskToDelete(null) });
  };

  return (
    <MainLayout>
      {/* The board gets extra width so four columns fit side by side */}
      <div className={`mx-auto space-y-6 ${layout === 'board' ? 'max-w-7xl' : 'max-w-6xl'}`}>
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

        <TaskStatsSection counts={counts} activeFilter={statusFilter} isLoading={isLoading} onSelect={setStatusFilter} />

        <TaskFiltersSection
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          layout={layout}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
          onLayoutChange={setLayout}
        />

        {isLoading || isError || visibleTasks.length === 0 ? (
          <TaskStates
            layout={layout}
            isLoading={isLoading}
            isError={isError}
            isFiltered={viewTasks.length > 0}
            onRetry={() => refetch()}
            onClearFilters={clearFilters}
            onCreate={canCreate ? openCreate : undefined}
          />
        ) : layout === 'board' ? (
          <TaskBoardSection tasks={visibleTasks} onCreate={canCreate ? openCreate : undefined} onEdit={openEdit} onDelete={setTaskToDelete} />
        ) : (
          <TaskListSection tasks={visibleTasks} onEdit={openEdit} onDelete={setTaskToDelete} />
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
            <span className="font-medium text-gray-900">{taskToDelete?.title}</span> will be permanently removed. This can't be undone.
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
