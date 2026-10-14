import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { LeaveRequest } from '@/types';
import { getStatusIcon, getStatusBadge, getLeaveTypeBadge } from './leave-badges';

interface LeaveHistorySectionProps {
  requests: LeaveRequest[];
}

export function LeaveHistorySection({ requests }: LeaveHistorySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Leave History</span>
        </CardTitle>
        <CardDescription>Complete history of your leave requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                {getStatusIcon(request.status)}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    {getLeaveTypeBadge(request.leaveType)}
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">{request.reason}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Applied: {new Date(request.appliedDate).toLocaleDateString()}
                </p>
                {request.approvedDate && (
                  <p className="text-xs text-gray-500">
                    {request.status === 'approved' ? 'Approved' : 'Rejected'}: {new Date(request.approvedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
