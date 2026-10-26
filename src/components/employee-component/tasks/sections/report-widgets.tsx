import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDate } from '@/lib/utils';
import { isOverdue, type Burndown, type ProjectProgress, type WeekThroughput } from '@/lib/task-reports';
import type { Project, Sprint, Task } from '@/types';
import { PriorityIndicator, UserChip } from './task-badges';
import { taskPath } from './task-link';
import { CHART_COLORS, ChartCard, ColumnChart, LineChart, ProgressBar } from './charts';
import { projectSummaryPath } from './report-links';

// Reserved status colours; always shown with an icon and a label
export const STATUS_COLORS = { critical: '#d03b3b', warning: '#fab219', serious: '#ec835a', good: '#0ca30c' } as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const daysLate = (dueDate: string, today: Date) => Math.max(1, Math.round((new Date(today.toDateString()).getTime() - new Date(`${dueDate}T00:00:00`).getTime()) / MS_PER_DAY));

/* ---------- Project progress ---------- */

export function ProjectProgressCard({ rows }: { rows: ProjectProgress[] }) {
  return (
    <ChartCard
      title="Progress by project"
      subtitle="Share of work items that are done"
      table={{
        columns: ['Project', '% complete', 'Done', 'Open', 'Overdue', 'Blocked'],
        rows: rows.map((row) => [`${row.project.name} (${row.project.key})`, `${row.percentComplete}%`, row.done, row.open, row.overdue, row.blocked]),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No project work yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.project.id}>
              <Link
                to={projectSummaryPath(row.project.key)}
                className="group -mx-2 flex items-center gap-4 rounded-md px-2 py-3 hover:bg-indigo-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium text-gray-900 group-hover:text-[#464EB8]">
                      {row.project.name} <span className="text-xs font-normal text-gray-500">{row.project.key}</span>
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">{row.percentComplete}%</p>
                  </div>
                  <ProgressBar percent={row.percentComplete} label={`${row.project.name} ${row.percentComplete}% complete`} />
                  <p className="flex flex-wrap gap-x-3 text-xs text-gray-500">
                    <span>
                      {row.done} of {row.total} done
                    </span>
                    {row.overdue > 0 && (
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <AlertTriangle className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.critical }} aria-hidden="true" />
                        {row.overdue} overdue
                      </span>
                    )}
                    {row.blocked > 0 && (
                      <span className="inline-flex items-center gap-1 text-gray-700">
                        <Ban className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.serious }} aria-hidden="true" />
                        {row.blocked} blocked
                      </span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-[#464EB8]" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

/* ---------- Velocity, trend, burndown ---------- */

export function VelocityCard({ weeks }: { weeks: WeekThroughput[] }) {
  const recent = weeks.slice(-4);
  const average = recent.length === 0 ? 0 : Math.round((recent.reduce((sum, week) => sum + week.completed, 0) / recent.length) * 10) / 10;
  return (
    <ChartCard
      title="Team velocity"
      subtitle={`Work items finished per week · avg ${average} over the last 4 weeks`}
      table={{ columns: ['Week of', 'Finished'], rows: weeks.map((week) => [week.label, week.completed]) }}
    >
      <ColumnChart data={weeks.map((week) => ({ label: week.label, value: week.completed }))} ariaLabel="Work items finished per week" valueName="Finished" />
    </ChartCard>
  );
}

export function TrendCard({ weeks }: { weeks: WeekThroughput[] }) {
  return (
    <ChartCard
      title="Created vs finished"
      subtitle="Weekly trend: finishing more than is created shrinks the backlog"
      table={{ columns: ['Week of', 'Created', 'Finished'], rows: weeks.map((week) => [week.label, week.created, week.completed]) }}
    >
      <LineChart
        data={weeks}
        series={[
          { key: 'completed', name: 'Finished', color: CHART_COLORS.series1 },
          { key: 'created', name: 'Created', color: CHART_COLORS.series2 },
        ]}
        ariaLabel="Work items created and finished per week"
      />
    </ChartCard>
  );
}

export function BurndownCard({ burndown, sprints, onSprintChange }: { burndown: Burndown | null; sprints: Sprint[]; onSprintChange: (sprintId: string) => void }) {
  if (!burndown) {
    return (
      <ChartCard title="Sprint burndown">
        <p className="py-10 text-center text-sm text-gray-500">No active sprint right now.</p>
      </ChartCard>
    );
  }
  const { sprint, scope, remaining, points } = burndown;
  const today = [...points].reverse().find((point) => point.remaining !== null);
  const behind = today && today.remaining !== null && today.remaining > Math.ceil(today.ideal);
  return (
    <ChartCard
      title="Sprint burndown"
      subtitle={
        <>
          {sprint.name} · {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)} · {remaining} of {scope} left
          {today && (
            <span className="ml-1 inline-flex items-center gap-1 text-gray-700">
              ·{' '}
              {behind ? (
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.warning }} aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.good }} aria-hidden="true" />
              )}
              {behind ? 'Behind plan' : 'On track'}
            </span>
          )}
        </>
      }
      actions={
        sprints.length > 1 && (
          <select
            value={sprint.id}
            onChange={(event) => onSprintChange(event.target.value)}
            aria-label="Sprint"
            className="h-8 rounded-md border border-input bg-white px-2 text-xs"
          >
            {sprints.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        )
      }
      table={{ columns: ['Day', 'Ideal', 'Remaining'], rows: points.map((point) => [point.label, point.ideal, point.remaining ?? '—']) }}
    >
      <LineChart
        data={points}
        series={[
          { key: 'remaining', name: 'Remaining', color: CHART_COLORS.series1 },
          { key: 'ideal', name: 'Ideal', color: CHART_COLORS.reference, dashed: true },
        ]}
        areaKey="remaining"
        ariaLabel={`Burndown for ${sprint.name}`}
      />
    </ChartCard>
  );
}

/* ---------- Risks ---------- */

export function RiskTable({ risks, projects, today = new Date(), limit }: { risks: Task[]; projects: Project[]; today?: Date; limit?: number }) {
  const shown = limit ? risks.slice(0, limit) : risks;
  return (
    <ChartCard
      title="At risk"
      subtitle="High or urgent work that is overdue or blocked"
      actions={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{risks.length}</span>}
    >
      {risks.length === 0 ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
          <ShieldCheck className="h-5 w-5" style={{ color: STATUS_COLORS.good }} aria-hidden="true" />
          Nothing high-priority is overdue or blocked.
        </p>
      ) : (
        <div className="app-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Assignee</th>
                <th className="px-3 py-2">Due</th>
                <th className="px-3 py-2">Why</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map((task) => {
                const overdue = isOverdue(task, today);
                return (
                  <tr key={task.id} className="hover:bg-indigo-50/40">
                    <td className="max-w-[280px] px-3 py-2">
                      <Link to={taskPath(task.key)} className="font-medium text-[#464EB8] hover:underline">
                        {task.key}
                      </Link>
                      <p className="truncate text-gray-700" title={task.title}>
                        {task.title}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-gray-700">{projects.find((project) => project.id === task.projectId)?.key ?? '—'}</td>
                    <td className="px-3 py-2">
                      <PriorityIndicator priority={task.priority} />
                    </td>
                    <td className="px-3 py-2">{getUserById(task.assigneeId) ? <UserChip userId={task.assigneeId} /> : <span className="text-gray-500">Unassigned</span>}</td>
                    <td className={cn('whitespace-nowrap px-3 py-2', overdue ? 'font-medium text-gray-900' : 'text-gray-700')}>{formatDate(task.dueDate)}</td>
                    <td className="px-3 py-2">
                      <span className="flex flex-col gap-0.5 text-xs text-gray-700">
                        {overdue && (
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.critical }} aria-hidden="true" />
                            Overdue {daysLate(task.dueDate, today)}d
                          </span>
                        )}
                        {task.isBlocked && (
                          <span className="inline-flex items-center gap-1" title={task.blockedReason}>
                            <Ban className="h-3.5 w-3.5" style={{ color: STATUS_COLORS.serious }} aria-hidden="true" />
                            Blocked
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {limit && risks.length > limit && <p className="text-xs text-gray-500">Showing the top {limit} of {risks.length}.</p>}
    </ChartCard>
  );
}
