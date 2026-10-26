import type { InfoContent } from "@/components/common-component/info";
import { ROLE_LABELS } from "@/lib/mock-users";
import { CORE_MODULES, getModuleLabel } from "@/lib/modules";

const ALWAYS_KEPT = CORE_MODULES.map(getModuleLabel).join(" and ");

// The ⓘ next to the Roles & Permissions title
export const ROLES_PERMISSIONS_INFO: InfoContent = {
  title: "About Roles & Permissions",
  description: "Sets what each role can do in the portal and which pages each role sees by default.",
  sections: [
    {
      heading: "What you can do here",
      text: `The roles are ${Object.values(ROLE_LABELS).join(", ")}.`,
      items: [
        "Permission matrix: for each role, choose whether they can do an action and on whose work (Own, Team, HR only or All)",
        "Save your changes, discard them, or reset the matrix to the portal's original settings",
        "Default pages: see which pages appear in each role's menu",
      ],
    },
    {
      heading: "How page access works",
      items: [
        "Adding or removing a page for one person is done in User Management",
        `${ALWAYS_KEPT} are for everyone; system pages (marked with a lock) stay with the System Admin role`,
        "Having a page only lets someone open it; what they can do inside still follows the permission matrix",
        "System Admin always keeps Task settings and Manage users, so no one can be locked out",
      ],
    },
  ],
};
