import { AlertTriangle } from 'lucide-react';
import { REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import type { CategoryReport } from '@/lib/desk-reports';
import { formatDuration } from '@/lib/sla';
import type { SlaTargets } from '@/types';
import { CHART_COLORS, ChartCard, ProgressBar } from '@/components/employee-component/tasks/sections/charts';
import { STATUS_COLORS } from '@/components/employee-component/tasks/sections/report-widgets';
import { CategoryChip } from '@/components/admin-component/service-desk/sections/desk-badges';

export function ResolutionTimeSection({ categories, sla }: { categories: CategoryReport[]; sla: SlaTargets }) {
  const maxResolution = Math.max(1, ...categories.map((row) => row.avgResolutionMs ?? 0));

  return (
    <ChartCard
      title="Average resolution time"
      subtitle="Per category, against its target · paused time excluded"
      table={{
        columns: ['Category', 'Avg response', 'Avg resolution', 'Resolution target'],
        rows: categories.map((row) => [
          REQUEST_CATEGORY_LABELS[row.category],
          row.avgResponseMs === null ? '—' : formatDuration(row.avgResponseMs),
          row.avgResolutionMs === null ? '—' : formatDuration(row.avgResolutionMs),
          `${sla[row.category].resolutionHours}h`,
        ]),
      }}
    >
      <ul className="space-y-3">
        {categories.map((row) => {
          const over = row.avgResolutionMs !== null && row.avgResolutionMs > sla[row.category].resolutionHours * 3600000;
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
  );
}
