import type { InfoContent } from "@/components/common-component/info";
import { categoryConfig } from "./kpi-meta";

const CATEGORIES = Object.values(categoryConfig)
  .map((category) => category.label)
  .join(", ");

// The ⓘ next to the KPI Monitoring title
export const KPI_MONITORING_INFO: InfoContent = {
  title: "About KPI Monitoring",
  description: "Tracks the organisation's key measures against their targets so problems are spotted early.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        `Filter KPIs by category (${CATEGORIES}) or by status`,
        "Click the On Track, At Risk or Off Track card to show only those KPIs; click it again to show all",
        "Click any KPI to see its target, progress, recent trend and how each department is doing",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "Overall Health is the share of KPIs that are on track",
        "For some KPIs higher is better, for others (like attrition) lower is better; progress to target takes this into account",
        "Active Alerts lists the KPIs that need attention this period, with how serious each one is",
      ],
    },
  ],
};
