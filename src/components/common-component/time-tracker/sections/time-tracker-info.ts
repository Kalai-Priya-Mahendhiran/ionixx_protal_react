import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Time Tracker title
export const TIME_TRACKER_INFO: InfoContent = {
  title: 'About Time Tracker',
  description: 'Record the time you spend on projects and keep a daily log of your tasks.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        "Start the timer for what you're working on, then stop it to save the time as an entry",
        "Use Add Entry to log time by hand, and edit or delete today's entries",
        'Add tasks with estimated and actual hours, and keep their status up to date',
        'Select a task status card to show only those tasks, or pick dates to see other days',
      ],
    },
    {
      heading: 'Good to know',
      items: [
        'Choose a project, epic, task type and description before starting the timer',
        'Pause holds the time so far; Stop saves it as an entry',
        'Time you log against a task in Tasks shows up here too',
        "The weekly chart shows this week's hours by project",
      ],
    },
  ],
};
