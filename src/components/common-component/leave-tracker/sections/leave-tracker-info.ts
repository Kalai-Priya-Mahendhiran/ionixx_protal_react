import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Leave Tracker title
export const LEAVE_TRACKER_INFO: InfoContent = {
  title: 'About Leave Tracker',
  description: 'Apply for leave, check how many days you have left and follow your requests.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        'Apply for leave for full days or half days, with a reason',
        'See how many days of each leave type you have left',
        "Check the calendar for your leave and holidays, or switch country to see another office's holidays",
        'Filter your leave history by status',
      ],
    },
    {
      heading: 'Good to know',
      items: [
        'Weekends and public holidays are not counted as leave days',
        'Only approved leave is taken off your balance',
        'Restricted Holiday can only be used on restricted holiday dates',
        'You cannot apply twice for the same dates',
      ],
    },
  ],
};
