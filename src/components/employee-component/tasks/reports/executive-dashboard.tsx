import { useMemo, useState } from 'react';
import { AlertTriangle, Ban, CheckCircle2, CircleDot } from 'lucide-react';
import { finishedInLastWeek, getBurndown, getProjectProgress, getRisks, getWeeklyThroughput, summarize } from '@/lib/task-reports';
import type { Project, Sprint, Task } from '@/types';
import { BurndownCard, HeroStat, ProjectProgressCard, RiskTable, STATUS_COLORS, StatTile, TrendCard, VelocityCard } from './report-widgets';

export function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading reports">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-72 animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

export function ReportError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
      Couldn't load the reports.{' '}
      <button type="button" onClick={onRetry} className="font-medium underline">
        Try again
      </button>
    </div>
  );
}

/*
 * Read-only overview for executives (and admins): progress, velocity, burndown, trends and risks.
 * No editing controls; clicking a project opens its summary page.
 */
export function ExecutiveDashboard({
  tasks,
  projects,
  sprints,
  isLoading,
  isError,
  onRetry,
}: {
  tasks: Task[];
  projects: Project[];
  sprints: Sprint[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const activeSprints = useMemo(() => sprints.filter((sprint) => sprint.status === 'active'), [sprints]);
  const [sprintId, setSprintId] = useState<string>();
  const sprint = activeSprints.find((item) => item.id === sprintId) ?? activeSprints[0];

  const report = useMemo(() => {
    const today = new Date();
    return {
      today,
      summary: summarize(tasks, today),
      projects: getProjectProgress(tasks, projects, today),
      weeks: getWeeklyThroughput(tasks, 9, today),
      risks: getRisks(tasks, today),
      finishedThisWeek: finishedInLastWeek(tasks, today),
    };
  }, [tasks, projects]);
  const burndown = useMemo(() => (sprint ? getBurndown(tasks, sprint, report.today) : null), [tasks, sprint, report.today]);

  if (isLoading) return <ReportSkeleton />;
  if (isError) return <ReportError onRetry={onRetry} />;

  const { summary } = report;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <HeroStat
          label="Overall complete"
          value={`${summary.percentComplete}%`}
          detail={
            <>
              {summary.done} of {summary.total} work items done across {report.projects.length} {report.projects.length === 1 ? 'project' : 'projects'}
            </>
          }
        />
        <StatTile label="Open" value={summary.open} icon={CircleDot} iconColor="#6b7280" hint="Not done yet" />
        <StatTile label="Overdue" value={summary.overdue} icon={AlertTriangle} iconColor={STATUS_COLORS.critical} hint="Past due date, not done" />
        <StatTile label="Blocked" value={summary.blocked} icon={Ban} iconColor={STATUS_COLORS.serious} hint="Flagged as blocked" />
        <StatTile label="Finished this week" value={report.finishedThisWeek} icon={CheckCircle2} iconColor={STATUS_COLORS.good} hint="Done in the last 7 days" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectProgressCard rows={report.projects} />
        <BurndownCard burndown={burndown} sprints={activeSprints} onSprintChange={setSprintId} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <VelocityCard weeks={report.weeks} />
        <TrendCard weeks={report.weeks} />
      </div>

      <RiskTable risks={report.risks} projects={projects} today={report.today} />
    </div>
  );
}
