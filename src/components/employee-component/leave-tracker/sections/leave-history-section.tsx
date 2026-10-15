import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { LEAVE_HISTORY_MAX_HEIGHT_CLASS } from '@/lib/constants';
import type { LeaveRequest } from '@/types';
import { getStatusBadge, getLeaveTypeBadge } from './leave-badges';
import { ALL_LEAVE_STATUSES, formatLeaveDate, getDayPartLabel } from './leave-utils';
import { LeaveStatusFilter } from './leave-status-filter';

const HISTORY_COLUMNS = ['Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied On', 'Status', 'Approved By'];

interface LeaveHistorySectionProps {
  requests: LeaveRequest[];
}

export function LeaveHistorySection({ requests }: LeaveHistorySectionProps) {
  const [statusFilter, setStatusFilter] = useState<LeaveRequest['status'][]>(ALL_LEAVE_STATUSES);

  const statusCounts = Object.fromEntries(
    ALL_LEAVE_STATUSES.map((status) => [status, requests.filter((request) => request.status === status).length]),
  ) as Record<LeaveRequest['status'], number>;

  const sortedRequests = requests
    .filter((request) => statusFilter.includes(request.status))
    .sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-100">
              <FileText className="h-5 w-5 text-indigo-600" />
            </div>
            <span>Leave History</span>
          </CardTitle>
          <CardDescription>
            Showing {sortedRequests.length} of {requests.length} leave requests
          </CardDescription>
        </div>
        <LeaveStatusFilter selected={statusFilter} counts={statusCounts} onApply={setStatusFilter} />
      </CardHeader>
      <CardContent>
        <div className={`overflow-auto ionixx-scrollbar rounded-lg border border-indigo-100 ${LEAVE_HISTORY_MAX_HEIGHT_CLASS}`}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-50 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <tr>
                {HISTORY_COLUMNS.map((column) => (
                  <th key={column} className="px-4 py-3 whitespace-nowrap">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {sortedRequests.map((request) => (
                <tr key={request.id} className="hover:bg-indigo-50/40">
                  <td className="px-4 py-3 whitespace-nowrap">{getLeaveTypeBadge(request.leaveType)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{formatLeaveDate(request.startDate)}</p>
                    <p className="text-xs text-gray-500">{getDayPartLabel(request.startDayPart)}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-medium text-gray-900">{formatLeaveDate(request.endDate)}</p>
                    <p className="text-xs text-gray-500">{getDayPartLabel(request.endDayPart)}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#464EB8]">{request.days ?? '—'}</td>
                  <td className="px-4 py-3 min-w-[160px] text-gray-600">{request.reason}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatLeaveDate(request.appliedDate)}</td>
                  <td className="px-4 py-3">{getStatusBadge(request.status)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {request.status === 'pending' || !request.approvedBy ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <>
                        <p className="font-medium text-gray-900">{request.approvedBy}</p>
                        {request.approvedDate && (
                          <p className="text-xs text-gray-500">{formatLeaveDate(request.approvedDate)}</p>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {sortedRequests.length === 0 && (
                <tr>
                  <td colSpan={HISTORY_COLUMNS.length} className="px-4 py-6 text-center text-gray-500">
                    {requests.length === 0 ? 'No leave requests yet' : 'No leave requests match the selected filter'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
