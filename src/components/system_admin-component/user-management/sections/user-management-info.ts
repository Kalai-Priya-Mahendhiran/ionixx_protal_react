import type { InfoContent } from "@/components/common-component/info";
import { CORE_MODULES, getModuleLabel } from "@/lib/modules";

const ALWAYS_KEPT = CORE_MODULES.map(getModuleLabel).join(" and ");

// The ⓘ next to the User Management title
export const USER_MANAGEMENT_INFO: InfoContent = {
  title: "About User Management",
  description: "Everyone's portal account in one place: who can sign in, their role, which pages they see and which projects they're on.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Invite a user: they get an email to set a password and show as Invited until they sign in",
        "Search by name, email, ID or department, filter by role or status, or click a count card",
        "Click Manage to change someone's role, pages and projects, or reset their password",
        "Deactivate someone who has left and hand their open tasks to a colleague; you can reactivate them later",
      ],
    },
    {
      heading: "How page access works",
      items: [
        "Each role comes with a set of pages (see Roles & Permissions, Default pages)",
        "You can add or remove a page for one person; these show as Added or Removed",
        `${ALWAYS_KEPT} are always kept, and system pages stay with the System Admin role`,
        "Anyone with people reporting to them gets Approvals, Team Overview and Performance Review automatically",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "A role change applies at the person's next sign-in",
        "Deactivated people can't sign in and don't appear in pickers, but their history stays",
        "You can't deactivate your own account",
      ],
    },
  ],
};
