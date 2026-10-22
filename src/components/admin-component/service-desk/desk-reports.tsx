import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox, PieChart, ShieldCheck, Timer } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { ROUTES } from '@/lib/constants';
import { DEFAULT_DESK_SETTINGS, REQUEST_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import { getBreachedRequests, getCategoryReport, getMonthlySpend, getMonthlyTrend, inPeriod, summarizeDesk } from '@/lib/desk-reports';
import { formatDuration } from '@/lib/sla';
import { cn } from '@/lib/utils';
import { useDeskSettings, useExpenses, useRequests } from '@/services/apis/service-desk/use-service-desk';
import { CHART_COLORS, ChartCard, ColumnChart, LineChart, ProgressBar } from '@/components/employee-component/tasks/reports/charts';
import { STATUS_COLORS } from '@/components/employee-component/tasks/reports/report-widgets';
import { CategoryChip, RequestStatusBadge } from './desk-badges';
import { requestPath } from './desk-links';

const PERIODS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
] as const;

// Requests, SLA performance and office spend for the Admin team (desk.reports)
export default function DeskReports() {
  const { data: requests = [], isLoading, isError, refetch } = useRequests();
  const { data: expenses = [] } = useExpenses();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const [days, setDays] = useState<number>(30);

  const report = useMemo(() => {
    const now = new Date();
    const scoped = inPeriod(requests, days || undefined, now);
    return {
      summary: summarizeDesk(scoped, settings.sla, now),
      categories: getCategoryReport(scoped, settings.sla, now),
      breaches: getBreachedRequests(scoped, settings.sla, now),
      trend: getMonthlyTrend(requests, 3, now),
      spend: getMonthlySpend(expenses, settings.budgets, 3, now),
    };
  }, [requests, expenses, settings, days]);

  const { summary, categories } = report;
  const maxTotal = Math.max(1, ...categories.map((row) => row.total));
  const maxResolution = Math.max(1, ...categories.map((row) => row.avgResolutionMs ?? 0));
  const metRate = summary.slaMetRate === null ? '—' : `${Math.round(summary.slaMetRate * 100)}%`;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={PieChart}
          title="Desk Reports"
          description="Requests by category, resolution times, SLA breaches and office spend"
          actions={
            <div role="group" aria-label="Period" className="inline-flex rounded-lg border border-white/30 bg-white/10 p-0.5">
              {PERIODS.map((period) => (
                <button
                  key={period.days}
                  type="button"
                  aria-pressed={days === period.days}
                  onClick={() => setDays(period.days)}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium', days === period.days ? 'bg-white text-[#464EB8] shadow-sm' : 'text-white/90 hover:text-white')}
                >
                  {period.label}
                </button>
              ))}
            </div>
          }
        />

        {isLoading ? (
          <div className="h-96 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Loading reports" />
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load the reports.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            <StatGrid>
              <StatCard icon={ShieldCheck} label="SLA met" value={metRate} tone="indigo" hint={summary.resolved === 0 ? 'None finished yet' : `of ${summary.resolved} resolved`} />
              <StatCard icon={Inbox} label="Requests raised" value={summary.total} tone="gray" />
              <StatCard icon={Inbox} label="Open now" value={summary.open} tone="gray" />
              <StatCard icon={Timer} label="Avg resolution" value={summary.avgResolutionMs === null ? '—' : formatDuration(summary.avgResolutionMs)} tone="gray" hint="Excl. Waiting" />
              <StatCard icon={AlertTriangle} label="Open & breached" value={summary.breachedOpen} tone="red" hint="Past a target" />
            </StatGrid>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Requests by category"
                subtitle={`${summary.total} requests · ${PERIODS.find((period) => period.days === days)?.label.toLowerCase()}`}
                table={{ columns: ['Category', 'Requests', 'Open', 'SLA breaches'], rows: categories.map((row) => [REQUEST_CATEGORY_LABELS[row.category], row.total, row.open, row.breaches]) }}
              >
                <ul className="space-y-3">
                  {categories.map((row) => (
                    <li key={row.category} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                      <CategoryChip category={row.category} />
                      <ProgressBar percent={Math.round((row.total / maxTotal) * 100)} label={`${REQUEST_CATEGORY_LABELS[row.category]}: ${row.total}`} />
                      <span className="text-right font-semibold tabular-nums text-gray-900">{row.total}</span>
                    </li>
                  ))}
                </ul>
              </ChartCard>

              <ChartCard
                title="Average resolution time"
                subtitle="Per category, against its target · paused time excluded"
                table={{
                  columns: ['Category', 'Avg response', 'Avg resolution', 'Resolution target'],
                  rows: categories.map((row) => [
                    REQUEST_CATEGORY_LABELS[row.category],
                    row.avgResponseMs === null ? '—' : formatDuration(row.avgResponseMs),
                    row.avgResolutionMs === null ? '—' : formatDuration(row.avgResolutionMs),
                    `${settings.sla[row.category].resolutionHours}h`,
                  ]),
                }}
              >
                <ul className="space-y-3">
                  {categories.map((row) => {
                    const over = row.avgResolutionMs !== null && row.avgResolutionMs > settings.sla[row.category].resolutionHours * 3600000;
                    return (
                      <li key={row.category} className="grid grid-cols-[7.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm">
                        <CategoryChip category={row.category} />
                        {row.avgResolutionMs === null ? (
                          <span className="text-xs text-gray-400">No resolved requests</span>
                        ) : (
                          <ProgressBar
                            percent={Math.round((row.avgResolutionMs / maxResolution) * 100)}
                            color={over ? STATUS_COLORS.critical : CHART_COLORS.series1}
                            label={`${REQUEST_CATEGORY_LABELS[row.category]}: ${formatDuration(row.avgResolutionMs)}`}
                          />
                        )}
                        <span className="inline-flex items-center justify-end gap-1 text-right font-semibold tabular-nums text-gray-900">
                          {over && <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-label="Over target" />}
                          {row.avgResolutionMs === null ? '' : formatDuration(row.avgResolutionMs)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </ChartCard>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Raised vs resolved"
                subtitle="Requests per month"
                table={{ columns: ['Month', 'Raised', 'Resolved'], rows: report.trend.map((month) => [month.label, month.raised, month.resolved]) }}
              >
                <LineChart
                  data={report.trend}
                  series={[
                    { key: 'resolved', name: 'Resolved', color: CHART_COLORS.series1 },
                    { key: 'raised', name: 'Raised', color: CHART_COLORS.series2 },
                  ]}
                  ariaLabel="Requests raised and resolved per month"
                />
              </ChartCard>

              <ChartCard
                title="Office spend"
                subtitle={
                  <>
                    ₹ thousands per month, against a {formatRupees(report.spend[0]?.budget ?? 0)} monthly budget ·{' '}
                    <Link to={ROUTES.Expenses} className="font-medium text-[#464EB8] hover:underline">
                      See expenses
                    </Link>
                  </>
                }
                table={{ columns: ['Month', 'Spent', 'Budget'], rows: report.spend.map((month) => [month.label, formatRupees(month.spent), formatRupees(month.budget)]) }}
              >
                <ColumnChart
                  data={report.spend.map((month) => ({ label: month.label, value: Math.round(month.spent / 1000) }))}
                  ariaLabel="Office spend per month in thousands of rupees"
                  valueName="Spent (₹ thousand)"
                />
              </ChartCard>
            </div>

            <ChartCard title="SLA breaches" subtitle="Requests that missed, or are past, a response or resolution target · worst open ones first">
              {report.breaches.length === 0 ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-gray-600">
                  <CheckCircle2 className="h-5 w-5" style={{ color: STATUS_COLORS.good }} aria-hidden="true" />
                  No SLA breaches in this period.
                </p>
              ) : (
                <div className="app-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                      <tr>
                        <th className="px-3 py-2">Request</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Missed</th>
                        <th className="px-3 py-2">By</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.breaches.map(({ request, kind, overByMs }) => (
                        <tr key={request.id} className="hover:bg-indigo-50/40">
                          <td className="max-w-[280px] px-3 py-2">
                            <Link to={requestPath(request.key)} className="font-medium text-[#464EB8] hover:underline">
                              {request.key}
                            </Link>
                            <p className="truncate text-gray-700">{request.title}</p>
                          </td>
                          <td className="px-3 py-2">
                            <CategoryChip category={request.category} />
                          </td>
                          <td className="px-3 py-2 text-gray-700">{kind === 'response' ? 'First response' : 'Resolution'}</td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 font-medium text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatDuration(overByMs)}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <RequestStatusBadge request={request} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </>
        )}
      </div>
    </MainLayout>
  );
}
