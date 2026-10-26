import type { InfoContent } from "@/components/common-component/info";

// The ⓘ next to the Employee Management title
export const EMPLOYEE_MANAGEMENT_INFO: InfoContent = {
  title: "About Employee Management",
  description: "The company's employee directory, where HR adds people and keeps their records.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Add an employee with their role, department, manager and joining date",
        "Search, filter by department or status, or click a card at the top",
        "Open anyone to see their contact details, employment details and documents",
        "Mark someone inactive when they leave, or reactivate them",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "A new employee is added to the org chart and gets an invitation to sign in",
        "Each employee ID can only be used once",
        "People added in User Management show up here too",
      ],
    },
  ],
};
