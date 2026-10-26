import type { InfoContent } from "@/components/common-component/info";
import { SERVICE_HEALTH_LABELS } from "@/lib/constants";

// The ⓘ next to the Logs & Monitoring title
export const LOGS_INFO: InfoContent = {
  title: "About Logs & Monitoring",
  description: "Shows the health of the portal's core services and a record of who changed what, and when.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        `See each core service's status (${Object.values(SERVICE_HEALTH_LABELS).join(", ")}), uptime and response time`,
        "Search the audit log by task key or text, and filter by person, area and date range",
        "Export the filtered log as a CSV file",
        "Open a task or request straight from its entry in the log",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "Changes made by automatic rules are shown as Automation",
        "This is the same log as Task Settings, Audit log",
      ],
    },
  ],
};
