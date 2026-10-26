import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, CircleDot, PieChart, SearchX } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { canOpenTaskView } from '@/lib/permissions/task-permissions';
import { countsTowardsProgress, finishedInLastWeek, getBurndown, getEpicProgress, getRisks, getWeeklyThroughput, summarize } from '@/lib/task-reports';
import { getWorkflowStatuses } from '@/lib/workflow';
import { useTaskSettings } from '@/services/apis/settings/use-task-settings';
import { useProjects, useSprints, useTasks } from '@/services/apis/tasks/use-tasks';
import { ReportError, ReportSkeleton } from '../sections/executive-dashboard';
import { BurndownCard, RiskTable, VelocityCard } from '../sections/report-widgets';
import { EpicsSection, ProjectHeaderSection, WorkByStatusSection } from './sections';

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
            <ProjectHeaderSection project={project} />

            <StatGrid>
              <StatCard icon={PieChart} label="Complete" value={`${report.summary.percentComplete}%`} tone="indigo" hint={`${report.summary.done} of ${report.summary.total} done`} />
              <StatCard icon={CircleDot} label="Open" value={report.summary.open} tone="gray" hint="Not done yet" />
              <StatCard icon={AlertTriangle} label="Overdue" value={report.summary.overdue} tone="red" hint="Past due date" />
              <StatCard icon={Ban} label="Blocked" value={report.summary.blocked} tone="orange" hint="Flagged" />
              <StatCard icon={CheckCircle2} label="Finished this week" value={report.finishedThisWeek} tone="green" hint="Last 7 days" />
            </StatGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <WorkByStatusSection byStatus={report.byStatus} />
              <EpicsSection epics={report.epics} />
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
