import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Columns3, Download, Eye, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import {
  can,
  canApprove,
  canOpenTaskView,
  getAssignableUsers,
  getSectionsForView,
  getScope,
  isTaskReadOnly,
  resolveTaskView,
  type TaskSection,
  type PermissionUser,
} from '@/lib/permissions/task-permissions';
import { downloadCsv, downloadXlsx } from '@/lib/task-export';
import { useDeleteTask, useEpics, useProjects, useSprints, useTasks } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import {
  ActiveFilterChips,
  AdvancedFiltersButton,
  ApprovalsSection,
  BulkActionsBar,
  ProjectsSection,
  ChecklistsSection,
  SectionTabs,
  TemplatesSection,
  SprintPlanningSection,
  TaskBoardSection,
  TaskSwimlanes,
  TeamAlertsPanel,
  WorkloadSection,
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
import { getFilterOptions } from './sections/filter-options';
import { ExecutiveDashboard } from './reports/executive-dashboard';
import { QuickFilters } from './sections/quick-filters';
import { SavedFiltersMenu } from './sections/saved-filters-menu';
import { ShortcutsDialog, type ShortcutHelp } from './sections/shortcuts-dialog';
import { AuditLogSection } from './settings/audit-log-section';
import { AutomationSettingsSection } from './settings/automation-settings';
import { FieldsSettingsSection } from './settings/fields-settings';
import { PermissionsSettingsSection } from './settings/permissions-settings';
import { WorkflowSettingsSection } from './settings/workflow-settings';
import { useTaskSettings } from '@/services/apis/settings/use-task-settings';
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
  EMPTY_FILTERS,
  filtersToParams,
  matchesAdvancedFilters,
  parseFilters,
  parseStatusFilter,
  filterStateToQuery,
  queryToParamChanges,
  type AdvancedFilters,
  type FilterState,
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
  // Subscribing redraws the page after a settings save (statuses, labels and permissions shape everything here)
  useTaskSettings();
  const { data: projects = [] } = useProjects();
  const { data: sprints = [] } = useSprints();
  const { data: epics = [] } = useEpics();
  const deleteTask = useDeleteTask();

  // Status lives in the URL with the other filters so a shared link shows the same tasks
  const statusFilter = parseStatusFilter(searchParams.get('status'));
  const setStatusFilter = (filter: TaskStatusFilter) => updateParams({ status: filter === 'all' ? null : filter }, true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
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
  // Project, department, assignee, priority, type and due-date filters live in the URL so the view can be shared
  const advancedFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const setAdvancedFilters = (filters: AdvancedFilters) => updateParams(filtersToParams(filters), true);
  // Status and advanced filters together, in one URL update
  const filterState: FilterState = { statusFilter, filters: advancedFilters };
  const setFilterState = (next: FilterState) =>
    updateParams({ status: next.statusFilter === 'all' ? null : next.statusFilter, ...filtersToParams(next.filters) }, true);
  const filterOptions = useMemo(() => getFilterOptions(scopedTasks, projects), [scopedTasks, projects]);
  const visibleTasks = scopedTasks.filter(
    (task) => matchesStatusFilter(task, statusFilter) && matchesSearch(task, searchTerm) && matchesAdvancedFilters(task, advancedFilters),
  );

  // Bulk selection (list layout); only tasks still on screen count as selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedTasks = visibleTasks.filter((task) => selectedIds.has(task.id));
  const canBulkEdit = can(user, 'task.changeStatus') || can(user, 'task.assign');

  const exportTasks = async (format: 'csv' | 'xlsx') => {
    const lookups = { projects, sprints, epics };
    try {
      if (format === 'csv') downloadCsv(visibleTasks, lookups);
      else await downloadXlsx(visibleTasks, lookups);
      toast.success(`Exported ${visibleTasks.length} ${visibleTasks.length === 1 ? 'task' : 'tasks'}`);
    } catch {
      toast.error("Couldn't create the export. Please try again.");
    }
  };

  // Links from before tasks had their own page (?task=IXP-102) go to /tasks/IXP-102
  useEffect(() => {
    if (legacyTaskKey) navigate(taskPath(legacyTaskKey), { replace: true });
  }, [legacyTaskKey, navigate]);

  // Tool tabs: manager tools on team-wide views, HR tools (Checklists · Templates) on the HR view
  const sections = getSectionsForView(user, view);
  const showSectionTabs = sections.length > 1;
  const requestedSection = searchParams.get('section') as TaskSection | null;
  // Views without a board (Settings) open on their first tab
  const defaultSection = sections.includes('board') ? 'board' : sections[0];
  const section: TaskSection = showSectionTabs && requestedSection && sections.includes(requestedSection) ? requestedSection : defaultSection;
  const isSettingsView = view === 'settings';
  const isOverview = view === 'exec-dashboard';
  const canGroupByAssignee = sections.includes('workload');
  const groupByAssignee = canGroupByAssignee && searchParams.get('group') === 'assignee';
  const focusUserId = searchParams.get('focus') ?? undefined;
  const approvalCount = viewTasks.filter((task) => canApprove(user, task)).length;
  // A manager's lanes are their team (even people with no work yet); org-wide users see whoever holds work
  const teamIds = useMemo(() => {
    const assignable = getAssignableUsers(user).map((member) => member.id);
    return getScope(user, 'task.assign') === 'team' ? assignable : assignable.filter((id) => viewTasks.some((task) => task.assigneeId === id));
  }, [user, viewTasks]);

  const canCreate = can(user, 'task.create');
  const readOnly = isTaskReadOnly(user);
  const { title, description } = TASK_VIEW_META[view];

  const openCreate = () => setFormState({ open: true, task: undefined });
  const openEdit = (task: Task) => setFormState({ open: true, task });
  // The task page links back here with the same view, tab, layout and filters
  const showTask = (task: Task) => navigate(taskPath(task.key), { state: { from: location.search } });
  const clearFilters = () => {
    setSearchTerm('');
    setFilterState({ statusFilter: 'all', filters: EMPTY_FILTERS });
  };

  // Keyboard: C create · / search · ? list of shortcuts (E edits on a task's own page)
  const showsTaskList = !isOverview && section === 'board';
  const createShortcut = canCreate && !isOverview && !isSettingsView ? openCreate : undefined;
  const shortcutHelp: ShortcutHelp[] = [
    ...(createShortcut ? [{ keys: 'C', label: 'Create a task' }] : []),
    ...(showsTaskList ? [{ keys: '/', label: 'Search tasks' }] : []),
    { keys: '?', label: 'Show these shortcuts' },
  ];
  useKeyboardShortcuts({
    c: createShortcut,
    '/': showsTaskList ? () => searchInputRef.current?.focus() : undefined,
    '?': () => setShortcutsOpen(true),
  });

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
          <div className="flex flex-wrap items-center gap-2">
            {view === 'all-projects' && canOpenTaskView(user, 'exec-dashboard') && (
              <Button variant="outline" onClick={() => navigate(`${location.pathname}?view=exec-dashboard`)} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </Button>
            )}
            {isSettingsView || isOverview ? (
              canOpenTaskView(user, 'all-projects') && (
                <Button variant="outline" onClick={() => navigate(`${location.pathname}?view=all-projects`)} className="gap-2">
                  <Columns3 className="h-4 w-4" />
                  {isOverview ? 'Browse all tasks' : 'View all tasks'}
                </Button>
              )
            ) : (
              canCreate && (
                <Button onClick={openCreate} title="Create a task (C)" aria-keyshortcuts="c" className="flex items-center gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                  <Plus className="h-4 w-4" />
                  <span>Create Task</span>
                  <span className="hidden rounded bg-white/20 px-1.5 font-mono text-xs sm:inline">C</span>
                </Button>
              )
            )}
          </div>
        </div>

        {showTabs && <TaskTabs active={tab} counts={tabCounts} onChange={(next) => updateParams({ tab: next })} />}

        {showSectionTabs && (
          <SectionTabs
            sections={sections}
            active={section}
            counts={{ approvals: approvalCount }}
            onChange={(next) => updateParams({ section: next === defaultSection ? null : next, focus: null })}
          />
        )}

        {isOverview ? (
          <ExecutiveDashboard tasks={viewTasks} projects={projects} sprints={sprints} isLoading={isLoading} isError={isError} onRetry={() => refetch()} />
        ) : section === 'workflow' ? (
          <WorkflowSettingsSection />
        ) : section === 'fields' ? (
          <FieldsSettingsSection />
        ) : section === 'permissions' ? (
          <PermissionsSettingsSection />
        ) : section === 'automation' ? (
          <AutomationSettingsSection />
        ) : section === 'audit' ? (
          <AuditLogSection />
        ) : section === 'projects' ? (
          <ProjectsSection projects={projects} tasks={tasks} />
        ) : section === 'templates' ? (
          <TemplatesSection />
        ) : section === 'checklists' ? (
          <ChecklistsSection tasks={tasks} subtaskProgress={subtaskProgress} onBrowseTemplates={() => updateParams({ section: 'templates' })} />
        ) : section === 'workload' ? (
          <WorkloadSection
            tasks={viewTasks}
            userIds={teamIds}
            onSelectPerson={(userId) => updateParams({ section: null, layout: null, group: 'assignee', focus: userId })}
          />
        ) : section === 'sprints' ? (
          <SprintPlanningSection tasks={viewTasks} projects={projects} />
        ) : section === 'approvals' ? (
          <ApprovalsSection tasks={viewTasks} subtaskProgress={subtaskProgress} />
        ) : (
          <>
            {showSectionTabs && !isLoading && <TeamAlertsPanel tasks={viewTasks} />}

            <TaskStatsSection counts={counts} activeFilter={statusFilter} isLoading={isLoading} onSelect={setStatusFilter} />

            <TaskFiltersSection
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              layout={layout}
              onSearchChange={setSearchTerm}
              onStatusFilterChange={setStatusFilter}
              onLayoutChange={(next) => updateParams({ layout: next })}
              groupByAssignee={groupByAssignee}
              onGroupByAssigneeChange={canGroupByAssignee ? (next) => updateParams({ group: next ? 'assignee' : null, focus: null }) : undefined}
              searchInputRef={searchInputRef}
              actions={
                <>
                  <AdvancedFiltersButton filters={advancedFilters} options={filterOptions} onChange={setAdvancedFilters} />
                  <SavedFiltersMenu
                    query={filterStateToQuery(filterState)}
                    search={searchTerm}
                    onApply={(saved) => {
                      updateParams(queryToParamChanges(saved.query), true);
                      setSearchTerm(saved.search ?? '');
                    }}
                  />
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={isLoading || visibleTasks.length === 0}>
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white">
                      <DropdownMenuLabel className="text-xs text-gray-500">
                        {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'} as shown
                      </DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => void exportTasks('csv')}>
                        <FileText className="text-gray-500" />
                        CSV (.csv)
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void exportTasks('xlsx')}>
                        <FileSpreadsheet className="text-green-600" />
                        Excel (.xlsx)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
              footer={
                <>
                  <QuickFilters state={filterState} userId={user.id} onChange={setFilterState} hidden={view === 'my-tasks' ? ['my-open'] : []} />
                  <ActiveFilterChips filters={advancedFilters} options={filterOptions} onChange={setAdvancedFilters} />
                </>
              }
            />

            {isLoading || isError || (visibleTasks.length === 0 && !groupByAssignee) ? (
              <TaskStates
                layout={layout}
                isLoading={isLoading}
                isError={isError}
                isFiltered={scopedTasks.length > 0}
                onRetry={() => refetch()}
                onClearFilters={clearFilters}
                onCreate={canCreate ? openCreate : undefined}
              />
            ) : layout === 'board' && groupByAssignee ? (
              <TaskSwimlanes
                key={focusUserId ?? 'all'}
                tasks={visibleTasks}
                laneUserIds={teamIds}
                workloadTasks={viewTasks}
                focusUserId={focusUserId}
                subtaskProgress={subtaskProgress}
                onOpen={showTask}
                onEdit={openEdit}
                onDelete={setTaskToDelete}
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
              <>
                {selectedTasks.length > 0 && (
                  <BulkActionsBar
                    selected={selectedTasks}
                    projects={projects}
                    onDone={() => setSelectedIds(new Set())}
                    onClear={() => setSelectedIds(new Set())}
                  />
                )}
                <TaskListSection
                  tasks={visibleTasks}
                  subtaskProgress={subtaskProgress}
                  onEdit={openEdit}
                  onDelete={setTaskToDelete}
                  selectedIds={canBulkEdit ? selectedIds : undefined}
                  onSelectionChange={canBulkEdit ? setSelectedIds : undefined}
                />
              </>
            )}
          </>
        )}
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} shortcuts={shortcutHelp} />

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
