import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { getBreachedRequests } from '@/lib/desk-reports';
import { formatDuration } from '@/lib/sla';
import { ChartCard } from '@/components/employee-component/tasks/sections/charts';
import { STATUS_COLORS } from '@/components/employee-component/tasks/sections/report-widgets';
import { CategoryChip, RequestStatusBadge } from '@/components/admin-component/service-desk/sections/desk-badges';
import { requestPath } from '@/components/admin-component/service-desk/sections/desk-links';

export function SlaBreachesSection({ breaches }: { breaches: ReturnType<typeof getBreachedRequests> }) {
  return (
    <ChartCard title="SLA breaches" subtitle="Requests that missed, or are past, a response or resolution target · worst open ones first">
      {breaches.length === 0 ? (
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
              {breaches.map(({ request, kind, overByMs }) => (
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
  );
}
