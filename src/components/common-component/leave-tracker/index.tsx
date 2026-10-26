import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { PageHeader } from '@/components/ui/page-header';
import { HOLIDAYS_BY_COUNTRY } from '@/lib/sample-data/leave-tracker-sample-data';
import { DEFAULT_LEAVE_COUNTRY } from '@/lib/constants';
import type { LeaveRequestFormValues } from '@/lib/schemas';
import type { LeaveCountry } from '@/types';
import { useApplyLeave, useLeaveRequests } from '@/services/apis/leave/use-leave';
import { useCreateFromLink } from '@/hooks/use-create-from-link';
import { useAuth } from '@/context/auth-context';
import { getOrgPeople } from '@/lib/org-chart';
import {
  ApplyLeaveSection,
  LeaveCalendarSection,
  LeaveHistorySection,
  LeaveBalanceSection
} from './sections';

// The office's country from a location like "Chennai, IN", so the calendar opens on that office's holidays
const COUNTRY_BY_CODE: Record<string, LeaveCountry> = { IN: 'india', CA: 'canada', US: 'united-states' };
const officeCountry = (location?: string): LeaveCountry => COUNTRY_BY_CODE[location?.split(',').pop()?.trim().toUpperCase() ?? ''] ?? DEFAULT_LEAVE_COUNTRY;

export default function Leave() {
  const { user } = useAuth();
  // Requests come from the shared leave service, so Tasks can warn when an assignee is on approved leave
  const { data: requests = [] } = useLeaveRequests();
  const applyLeaveRequest = useApplyLeave();
  // Starts on the person's office; they can still look at another country's holidays
  const [country, setCountry] = useState<LeaveCountry>(() => officeCountry(getOrgPeople().find((person) => person.id === user?.id)?.location));
  const holidays = HOLIDAYS_BY_COUNTRY[country];

  const applyLeave = (values: LeaveRequestFormValues, days: number) => applyLeaveRequest.mutate({ ...values, days });

  // Quick Add → Apply Leave
  useCreateFromLink(() =>
    requestAnimationFrame(() => {
      const form = document.getElementById('apply-leave');
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      form?.querySelector<HTMLElement>('button, input, select, textarea')?.focus({ preventScroll: true });
    }),
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <PageHeader icon={CalendarDays} title="Leave Tracker" description="Manage your leave requests and track your leave balance" />

        {/* Leave Balance */}
        <LeaveBalanceSection requests={requests} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Apply Leave */}
          <div id="apply-leave" className="scroll-mt-24">
            <ApplyLeaveSection requests={requests} holidays={holidays} onApply={applyLeave} />
          </div>

          {/* Leave Calendar */}
          <LeaveCalendarSection requests={requests} holidays={holidays} country={country} onCountryChange={setCountry} />
        </div>

        {/* Leave History */}
        <LeaveHistorySection requests={requests} />
      </div>
    </MainLayout>
  );
}
