import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { sampleLeaveRequests } from '@/lib/sample-data/leave-tracker-sample-data';
import { LEAVE_TYPES } from '@/lib/constants';
import {
  ApplyLeaveSection,
  LeaveCalendarSection,
  LeaveRequestsSection,
  LeaveHistorySection
} from './sections';

export default function Leave() {
  const [showApplyForm, setShowApplyForm] = useState(false);

  const leaveBalance = {
    casual: 12,
    sick: 7,
    earned: 15,
    maternity: 90,
    paternity: 15
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-600 mt-2">Manage your leave requests and track your leave balance</p>
          </div>
          <Button onClick={() => setShowApplyForm(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </Button>
        </div>

        {/* Leave Balance */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(leaveBalance).map(([type, balance]) => {
            const leaveType = LEAVE_TYPES.find(lt => lt.id === type);
            return (
              <Card key={type}>
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">{leaveType?.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{balance}</p>
                    <p className="text-xs text-gray-500">days remaining</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Apply for Leave */}
          <ApplyLeaveSection />

          {/* Leave Calendar */}
          <LeaveCalendarSection requests={sampleLeaveRequests} />
        </div>

        {/* Leave Requests */}
        <LeaveRequestsSection requests={sampleLeaveRequests} />

        {/* Leave History */}
        <LeaveHistorySection requests={sampleLeaveRequests} />
      </div>
    </MainLayout>
  );
}
