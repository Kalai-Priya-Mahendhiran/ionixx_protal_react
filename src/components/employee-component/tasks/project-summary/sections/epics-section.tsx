import { Link } from 'react-router-dom';
import type { EpicProgress } from '@/lib/task-reports';
import { ChartCard, ProgressBar } from '@/components/employee-component/tasks/sections/charts';
import { taskPath } from '@/components/employee-component/tasks/sections/task-link';

export function EpicsSection({ epics }: { epics: EpicProgress[] }) {
  return (
    <ChartCard
      title="Epics"
      subtitle="Share of each epic's work items that are done"
      table={{ columns: ['Epic', '% complete', 'Done', 'Total'], rows: epics.map((row) => [`${row.epic.key} ${row.epic.title}`, `${row.percent}%`, row.done, row.total]) }}
    >
      {epics.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">This project has no epics.</p>
      ) : (
        <ul className="space-y-4">
          {epics.map(({ epic, percent, done, total }) => (
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
  );
}
