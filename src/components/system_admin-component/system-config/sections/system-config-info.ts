import type { InfoContent } from "@/components/common-component/info";
import { initialModules } from "./system-config-meta";

const MODULE_GROUPS = [...new Set(initialModules.map((module) => module.category))].join(", ");

// The ⓘ next to the System Configuration title
export const SYSTEM_CONFIG_INFO: InfoContent = {
  title: "About System Configuration",
  description: "Portal-wide settings: which modules are switched on, automatic workflow rules and organisation defaults.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        `Modules: switch modules on or off, grouped into ${MODULE_GROUPS}`,
        "Workflow rules: add, edit, pause or delete \"when this happens, then do that\" rules",
        "System defaults: organisation name, domain, support email, timezone, work week, fiscal year, session timeout and password expiry",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "System defaults change only when you click Save changes; Reset undoes edits you haven't saved",
        "Module and rule switches change straight away, with no Save needed; deleting a rule can't be undone",
        "Which pages each person sees is managed in User Management and Roles & Permissions",
      ],
    },
  ],
};
