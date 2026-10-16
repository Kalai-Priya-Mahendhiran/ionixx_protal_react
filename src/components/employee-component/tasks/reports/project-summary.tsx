import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, CircleDot, Eye, SearchX } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { canOpenTaskView } from '@/lib/permissions/task-permissions';
import { countsTowardsProgress, finishedInLastWeek, getBurndown, getEpicProgress, getRisks, getWeeklyThroughput, summarize } from '@/lib/task-reports';
import { getStatusMeta, getWorkflowStatuses } from '@/lib/workflow';
import { getUserById } from '@/lib/user-directory';
import { useTaskSettings } from '@/services/apis/settings/use-task-settings';
import { useProjects, useSprints, useTasks } from '@/services/apis/tasks/use-tasks';
import { UserChip } from '../sections/task-badges';
import { taskPath } from '../sections/task-link';
import { ChartCard, ProgressBar } from './charts';
import { ReportError, ReportSkeleton } from './executive-dashboard';
import { BurndownCard, HeroStat, RiskTable, STATUS_COLORS, StatTile, VelocityCard } from './report-widgets';

/*
 * Read-only summary of one project, opened from the executive dashboard (/tasks/project/IXP).
 * Shows only the tasks the viewer may see; there are no editing controls.
 */
export default function ProjectSummary() {
  const { projectKey = '' } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const { data: tasks = [], isLoading, isError, refetch } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: sprints = [] } = useSprints();
  // Status names and colours follow Settings → Workflow
  useTaskSettings();

  const project = projects.find((item) => item.key.toUpperCase() === projectKey.toUpperCase());
  const projectTasks = useMemo(() => (project ? tasks.filter((task) => task.projectId === project.id) : []), [tasks, project]);
  const activeSprints = useMemo(() => sprints.filter((sprint) => sprint.projectId === project?.id && sprint.status === 'active'), [sprints, project]);
  const [sprintId, setSprintId] = useState<string>();
  const sprint = activeSprints.find((item) => item.id === sprintId) ?? activeSprints[0];

  const report = useMemo(() => {
    const today = new Date();
    const work = projectTasks.filter(countsTowardsProgress);
    return {
      today,
      summary: summarize(projectTasks, today),
      weeks: getWeeklyThroughput(projectTasks, 9, today, []),
      risks: getRisks(projectTasks, today),
      epics: getEpicProgress(projectTasks),
      finishedThisWeek: finishedInLastWeek(work, today),
      byStatus: getWorkflowStatuses()
        .map((status) => ({ status, count: work.filter((task) => task.status === status.id).length }))
        .filter((row) => row.count > 0),
    };
  }, [projectTasks]);
  const burndown = useMemo(() => (sprint ? getBurndown(projectTasks, sprint, report.today) : null), [projectTasks, sprint, report.today]);

  // Back to where the viewer came from, else the overview (or All Projects for those without it)
  const backTo =
    (location.state as { from?: string } | null)?.from ?? `${ROUTES.Tasks}?view=${user && canOpenTaskView(user, 'exec-dashboard') ? 'exec-dashboard' : 'all-projects'}`;
  const maxStatusCount = Math.max(1, ...report.byStatus.map((row) => row.count));

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#464EB8]">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>

        {isLoading || projectsLoading ? (
          <ReportSkeleton />
        ) : isError ? (
          <ReportError onRetry={() => refetch()} />
        ) : !project ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <SearchX className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-900">Project “{projectKey}” wasn't found</p>
            <p className="mt-1 text-sm text-gray-500">It may have been renamed, or you don't have access to it.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-700">{project.key}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  <Eye className="h-3.5 w-3.5" />
                  Read only
                </span>
              </div>
              {project.description && <p className="max-w-3xl text-gray-600">{project.description}</p>}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2">
                  Lead {getUserById(project.leadId) ? <UserChip userId={project.leadId} /> : <span className="text-gray-500">—</span>}
                </span>
                <span>
                  {project.memberIds.length} {project.memberIds.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <HeroStat
                label="Complete"
                value={`${report.summary.percentComplete}%`}
                detail={
                  <>
                    {report.summary.done} of {report.summary.total} work items done
                  </>
                }
              />
              <StatTile label="Open" value={report.summary.open} icon={CircleDot} iconColor="#6b7280" hint="Not done yet" />
              <StatTile label="Overdue" value={report.summary.overdue} icon={AlertTriangle} iconColor={STATUS_COLORS.critical} hint="Past due date, not done" />
              <StatTile label="Blocked" value={report.summary.blocked} icon={Ban} iconColor={STATUS_COLORS.serious} hint="Flagged as blocked" />
              <StatTile label="Finished this week" value={report.finishedThisWeek} icon={CheckCircle2} iconColor={STATUS_COLORS.good} hint="Done in the last 7 days" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Work by status"
                subtitle="Where the project's work items are now"
                table={{ columns: ['Status', 'Work items'], rows: report.byStatus.map((row) => [row.status.label, row.count]) }}
              >
                {report.byStatus.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">No work items yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {report.byStatus.map(({ status, count }) => (
                      <li key={status.id} className="grid grid-cols-[minmax(0,8rem)_1fr_2.5rem] items-center gap-3 text-sm">
                        <span className="truncate text-gray-700">{getStatusMeta(status.id).label}</span>
                        <ProgressBar percent={Math.round((count / maxStatusCount) * 100)} label={`${status.label}: ${count}`} />
                        <span className="text-right font-semibold tabular-nums text-gray-900">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>

              <ChartCard
                title="Epics"
                subtitle="Share of each epic's work items that are done"
                table={{ columns: ['Epic', '% complete', 'Done', 'Total'], rows: report.epics.map((row) => [`${row.epic.key} ${row.epic.title}`, `${row.percent}%`, row.done, row.total]) }}
              >
                {report.epics.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-500">This project has no epics.</p>
                ) : (
                  <ul className="space-y-4">
                    {report.epics.map(({ epic, percent, done, total }) => (
                      <li key={epic.id} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <Link to={taskPath(epic.key)} className="min-w-0 truncate text-gray-900 hover:text-[#464EB8] hover:underline" title={epic.title}>
                            <span className="font-medium text-gray-500">{epic.key}</span> {epic.title}
                          </Link>
                          <span className="shrink-0 text-xs text-gray-600">
                            <span className="font-semibold text-gray-900">{percent}%</span> · {done}/{total}
                          </span>
                        </div>
                        <ProgressBar percent={percent} label={`${epic.title} ${percent}% complete`} />
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <BurndownCard burndown={burndown} sprints={activeSprints} onSprintChange={setSprintId} />
              <VelocityCard weeks={report.weeks} />
            </div>

            <RiskTable risks={report.risks} projects={projects} today={report.today} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
