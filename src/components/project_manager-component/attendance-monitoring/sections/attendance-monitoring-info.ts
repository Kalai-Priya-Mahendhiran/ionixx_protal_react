import type { InfoContent } from "@/components/common-component/info";

// The ⓘ next to the Attendance Monitoring title
export const ATTENDANCE_MONITORING_INFO: InfoContent = {
  title: "About Attendance Monitoring",
  description: "Follow your team's attendance today and deal with anything out of the ordinary.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "See who has checked in, when they arrived and left, and who is away",
        "Click a card at the top, or pick a status, to see only those people",
        "Add a note to a late arrival, absence or half day to resolve it",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "Late arrivals, absences and half days without a note are listed under Exceptions to handle",
        "Your team includes the people who report to your reports",
        "Approved leave and work from home show automatically, and the list updates as people check in",
      ],
    },
  ],
};
