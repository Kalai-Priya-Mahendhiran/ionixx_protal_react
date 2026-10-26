import { getStatusMeta } from '@/lib/workflow';
import type { WorkflowStatus } from '@/types';
import { ChartCard, ProgressBar } from '@/components/employee-component/tasks/sections/charts';

export function WorkByStatusSection({ byStatus }: { byStatus: { status: WorkflowStatus; count: number }[] }) {
  const maxStatusCount = Math.max(1, ...byStatus.map((row) => row.count));

  return (
    <ChartCard
      title="Work by status"
      subtitle="Where the project's work items are now"
      table={{ columns: ['Status', 'Work items'], rows: byStatus.map((row) => [row.status.label, row.count]) }}
    >
      {byStatus.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">No work items yet.</p>
      ) : (
        <ul className="space-y-3">
          {byStatus.map(({ status, count }) => (
            <li key={status.id} className="grid grid-cols-[minmax(0,8rem)_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate text-gray-700">{getStatusMeta(status.id).label}</span>
              <ProgressBar percent={Math.round((count / maxStatusCount) * 100)} label={`${status.label}: ${count}`} />
              <span className="text-right font-semibold tabular-nums text-gray-900">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
