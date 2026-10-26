import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Dashboard greeting
export const DASHBOARD_INFO: InfoContent = {
  title: 'About Dashboard',
  description: 'Your starting point each day: check in, see how your month is going and catch up on what needs your attention.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        'Check in when you start work and check out when you finish',
        'See your attendance, tasks done, hours this week and leave left; select a card to open its page',
        'Open a notification to go straight to what it is about',
        'Use Quick Actions to jump to common tasks',
      ],
    },
    {
      heading: 'Good to know',
      items: [
        'Coming Up shows the next two weeks: tasks due, leave, holidays and team milestones',
        'Birthdays and work anniversaries cover the next 30 days',
        'Quick Actions only show shortcuts you are allowed to use',
        'Everything here updates on its own as things change',
      ],
    },
  ],
};
