import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { LeaveRequest } from '@/types';
import { getStatusBadge, getLeaveTypeBadge } from './leave-badges';

interface LeaveRequestsSectionProps {
  requests: LeaveRequest[];
}

export function LeaveRequestsSection({ requests }: LeaveRequestsSectionProps) {
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const approvedRequests = requests.filter(req => req.status === 'approved');
  const rejectedRequests = requests.filter(req => req.status === 'rejected');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <span>Pending Requests</span>
          </CardTitle>
          <CardDescription>{pendingRequests.length} requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getLeaveTypeBadge(request.leaveType)}
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm font-medium">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{request.reason}</p>
              </div>
            ))}
            {pendingRequests.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No pending requests</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approved Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Approved Requests</span>
          </CardTitle>
          <CardDescription>{approvedRequests.length} approved requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {approvedRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getLeaveTypeBadge(request.leaveType)}
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm font-medium">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{request.reason}</p>
                {request.approvedBy && (
                  <p className="text-xs text-green-600 mt-1">
                    Approved by {request.approvedBy}
                  </p>
                )}
              </div>
            ))}
            {approvedRequests.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No approved requests</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rejected Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span>Rejected Requests</span>
          </CardTitle>
          <CardDescription>{rejectedRequests.length} rejected requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rejectedRequests.map((request) => (
              <div key={request.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getLeaveTypeBadge(request.leaveType)}
                  {getStatusBadge(request.status)}
                </div>
                <p className="text-sm font-medium">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">{request.reason}</p>
              </div>
            ))}
            {rejectedRequests.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No rejected requests</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
