import type { InfoContent } from "@/components/common-component/info";
import { trendData } from "./analytics-meta";

const PERIODS = Object.keys(trendData).join(", ");

// The ⓘ next to the Analytics title
export const ANALYTICS_INFO: InfoContent = {
  title: "About Analytics",
  description: "A picture of how the workforce is changing: headcount, hiring, exits and where things are heading.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        `Pick a period (${PERIODS}) to update the summary cards and the Workforce Trend chart`,
        "Switch the trend chart between headcount, hires and exits",
        "See the headcount and attrition forecasts for the next three months",
        "Compare departments on headcount, hiring, productivity and budget used",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "Attrition rate is the average for the chosen period, and New Hires also shows the net growth after exits",
        "Forecasts are based on the current pace of hiring and attrition",
        "The forecasts, department breakdown and key insights don't change with the period",
      ],
    },
  ],
};
