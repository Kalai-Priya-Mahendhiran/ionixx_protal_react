import type { InfoContent } from "@/components/common-component/info";
import { COMPLIANCE_EMPLOYEE_STATUS_LABELS } from "@/lib/constants";

// The ⓘ next to the Compliance title; employee states come from the labels the Employee Status tab uses
const statuses = Object.values(COMPLIANCE_EMPLOYEE_STATUS_LABELS).map((label) => label.toLowerCase());

export const COMPLIANCE_INFO: InfoContent = {
  title: "About Compliance",
  description: "Keep the company's compliance documents current and check that every employee has submitted theirs.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Add a document with its category and expiry date",
        "Search documents by name, category or who uploaded them",
        "See which documents each employee still has to submit",
        "Look back at who did what in the Audit Logs tab",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "Action Items are documents that are expiring soon or have expired",
        `Each employee is marked ${statuses.slice(0, -1).join(", ")} or ${statuses[statuses.length - 1]}`,
        "Adding a document is recorded in the audit log",
      ],
    },
  ],
};
