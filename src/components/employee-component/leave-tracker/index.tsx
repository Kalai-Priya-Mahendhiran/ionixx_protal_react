import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { HOLIDAYS_BY_COUNTRY } from '@/lib/sample-data/leave-tracker-sample-data';
import { DEFAULT_LEAVE_COUNTRY } from '@/lib/constants';
import type { LeaveRequestFormValues } from '@/lib/schemas';
import type { LeaveCountry } from '@/types';
import { useApplyLeave, useLeaveRequests } from '@/services/apis/leave/use-leave';
import {
  ApplyLeaveSection,
  LeaveCalendarSection,
  LeaveHistorySection,
  LeaveBalanceSection
} from './sections';

export default function Leave() {
  // Requests come from the shared leave service, so Tasks can warn when an assignee is on approved leave
  const { data: requests = [] } = useLeaveRequests();
  const applyLeaveRequest = useApplyLeave();
  const [country, setCountry] = useState<LeaveCountry>(DEFAULT_LEAVE_COUNTRY);
  const holidays = HOLIDAYS_BY_COUNTRY[country];

  const applyLeave = (values: LeaveRequestFormValues, days: number) => applyLeaveRequest.mutate({ ...values, days });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl px-6 py-4 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <CalendarDays className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Leave Tracker</h1>
              <p className="text-sm text-white/90 mt-0.5">Manage your leave requests and track your leave balance</p>
            </div>
          </div>
        </div>

        {/* Leave Balance */}
        <LeaveBalanceSection requests={requests} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Apply Leave */}
          <ApplyLeaveSection requests={requests} holidays={holidays} onApply={applyLeave} />

          {/* Leave Calendar */}
          <LeaveCalendarSection requests={requests} holidays={holidays} country={country} onCountryChange={setCountry} />
        </div>

        {/* Leave History */}
        <LeaveHistorySection requests={requests} />
      </div>
    </MainLayout>
  );
}
