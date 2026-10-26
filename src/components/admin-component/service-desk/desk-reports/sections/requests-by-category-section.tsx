import { REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import type { CategoryReport } from '@/lib/desk-reports';
import { ChartCard, ProgressBar } from '@/components/employee-component/tasks/sections/charts';
import { CategoryChip } from '@/components/admin-component/service-desk/sections/desk-badges';

interface RequestsByCategorySectionProps {
  categories: CategoryReport[];
  total: number;
  // The chosen period, lower case, for the subtitle
  periodLabel: string | undefined;
}

export function RequestsByCategorySection({ categories, total, periodLabel }: RequestsByCategorySectionProps) {
  const maxTotal = Math.max(1, ...categories.map((row) => row.total));

  return (
    <ChartCard
      title="Requests by category"
      subtitle={`${total} requests · ${periodLabel}`}
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
  );
}
