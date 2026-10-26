import { useMemo, useState } from 'react';
import { AlertTriangle, Inbox, PieChart, ShieldCheck, Timer } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_DESK_SETTINGS } from '@/lib/desk-config';
import { canManageRequests, desksHandledBy } from '@/lib/permissions/desk-permissions';
import { getBreachedRequests, getCategoryReport, getMonthlySpend, getMonthlyTrend, inPeriod, summarizeDesk } from '@/lib/desk-reports';
import { formatDuration } from '@/lib/sla';
import { cn } from '@/lib/utils';
import { useDeskSettings, useExpenses, useRequests } from '@/services/apis/service-desk/use-service-desk';
import { OfficeSpendSection, RaisedResolvedSection, RequestsByCategorySection, ResolutionTimeSection, SlaBreachesSection } from './sections';
import { getDeskReportsInfo } from './sections/desk-reports-info';

const PERIODS = [
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
  { days: 0, label: 'All time' },
] as const;

// Requests, SLA performance and office spend for the desks the viewer works (desk.reports)
export default function DeskReports() {
  const { user } = useAuth();
  const { data: allRequests = [], isLoading, isError, refetch } = useRequests();
  const requests = useMemo(() => allRequests.filter((request) => canManageRequests(user, request)), [allRequests, user]);
  const deskCategories = useMemo(() => desksHandledBy(user).flatMap((desk) => desk.categories), [user]);
  const { data: expenses = [] } = useExpenses();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const [days, setDays] = useState<number>(30);

  const report = useMemo(() => {
    const now = new Date();
    const scoped = inPeriod(requests, days || undefined, now);
    return {
      summary: summarizeDesk(scoped, settings.sla, now),
      categories: getCategoryReport(scoped, settings.sla, now, deskCategories),
      breaches: getBreachedRequests(scoped, settings.sla, now),
      trend: getMonthlyTrend(requests, 3, now),
      spend: getMonthlySpend(expenses, settings.budgets, 3, now),
    };
  }, [requests, expenses, settings, days, deskCategories]);

  const { summary, categories } = report;
  const metRate = summary.slaMetRate === null ? '—' : `${Math.round(summary.slaMetRate * 100)}%`;

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={PieChart}
          title="Desk Reports"
          description="Requests by category, resolution times, SLA breaches and office spend"
          info={getDeskReportsInfo(desksHandledBy(user).map((desk) => desk.team), PERIODS.map((period) => period.label))}
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
              <RequestsByCategorySection categories={categories} total={summary.total} periodLabel={PERIODS.find((period) => period.days === days)?.label.toLowerCase()} />
              <ResolutionTimeSection categories={categories} sla={settings.sla} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <RaisedResolvedSection trend={report.trend} />
              <OfficeSpendSection spend={report.spend} />
            </div>

            <SlaBreachesSection breaches={report.breaches} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
