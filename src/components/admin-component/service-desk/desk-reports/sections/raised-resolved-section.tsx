import type { MonthTrend } from '@/lib/desk-reports';
import { CHART_COLORS, ChartCard, LineChart } from '@/components/employee-component/tasks/sections/charts';

export function RaisedResolvedSection({ trend }: { trend: MonthTrend[] }) {
  return (
    <ChartCard
      title="Raised vs resolved"
      subtitle="Requests per month"
      table={{ columns: ['Month', 'Raised', 'Resolved'], rows: trend.map((month) => [month.label, month.raised, month.resolved]) }}
    >
      <LineChart
        data={trend}
        series={[
          { key: 'resolved', name: 'Resolved', color: CHART_COLORS.series1 },
          { key: 'raised', name: 'Raised', color: CHART_COLORS.series2 },
        ]}
        ariaLabel="Requests raised and resolved per month"
      />
    </ChartCard>
  );
}
