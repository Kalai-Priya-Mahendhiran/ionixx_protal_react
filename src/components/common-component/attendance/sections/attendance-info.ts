import type { InfoContent } from '@/components/common-component/info';
import { HISTORY_DAYS } from '@/services/apis/attendance/attendance-service';

// How far back the calendar goes, in months
const HISTORY_MONTHS = Math.round(HISTORY_DAYS / 30);

// The ⓘ next to the Attendance title
export const ATTENDANCE_INFO: InfoContent = {
  title: 'About Attendance',
  description: 'See how each of your working days was marked and how your attendance is adding up.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        'See your present, absent and late days and your attendance % for the month',
        `Move the calendar back to earlier months (up to about ${HISTORY_MONTHS} months, and not before you joined)`,
        'Hover over a day on the calendar to see your check-in and check-out times',
        "Follow today's worked time and your break timings",
      ],
    },
    {
      heading: 'Good to know',
      items: [
        'You check in and out from the Dashboard; it shows up here straight away',
        'Half days count as half, and today counts once you have checked in',
        'Approved leave appears on the calendar on its own',
      ],
    },
  ],
};
