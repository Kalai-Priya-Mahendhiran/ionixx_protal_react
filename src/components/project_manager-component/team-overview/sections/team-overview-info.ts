import type { InfoContent } from "@/components/common-component/info";

// The ⓘ next to the Team Overview title
export const TEAM_OVERVIEW_INFO: InfoContent = {
  title: "About Team Overview",
  description: "See everyone in your team at a glance and where they're working today.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Click a card at the top to see only the people in the office, working remotely or on leave",
        "Search by name, role or employee ID, or pick a department",
        "Open anyone to see their contact details, manager, joining date and skills",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "You see this screen because people report to you",
        "Your team is everyone who reports to you, and the people who report to them",
        "Today's status comes from check-ins and approved leave, so it changes during the day",
      ],
    },
  ],
};
