import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
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
        <PageHeader icon={CalendarDays} title="Leave Tracker" description="Manage your leave requests and track your leave balance" />

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
