import type { InfoContent } from "@/components/common-component/info";
import { INTEGRATION_CATEGORIES } from "@/lib/constants";

// The ⓘ next to the Integrations title
export const INTEGRATIONS_INFO: InfoContent = {
  title: "About Integrations",
  description: "Connects the portal to outside systems and shows whether each one is connected and syncing.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Add an integration with its vendor, category, address and API key",
        "Search by name or vendor, filter by category or status, or click a count card",
        "Click Configure to see the details, sync now, connect or disconnect, or delete it",
      ],
    },
    {
      heading: "Good to know",
      items: [
        `Categories: ${INTEGRATION_CATEGORIES.join(", ")}`,
        "Only connected integrations can sync; the Errors card shows the ones that need attention",
        "API keys are hidden except for the last four characters",
      ],
    },
  ],
};
