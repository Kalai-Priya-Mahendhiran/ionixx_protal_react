import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Organization title
export const ORGANIZATION_INFO: InfoContent = {
  title: 'About Organization',
  description: "See who reports to whom, browse departments and find anyone's contact details.",
  sections: [
    {
      heading: 'What you can do here',
      items: [
        'Org Chart: follow the reporting line; it opens on your place, and My position brings you back',
        "Departments: see who's in each team",
        'Directory: search by name, employee ID, email or role, and filter by department or status',
        "Open anyone's profile for their contact details, manager and team, or show them in the org chart",
      ],
    },
    {
      heading: 'Good to know',
      items: [
        "Each person's status shows if they are in office, remote, on leave or not checked in yet",
        'People joining, moving or leaving show up here straight away',
      ],
    },
  ],
};
