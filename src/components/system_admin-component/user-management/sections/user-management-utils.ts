import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";
import type { AccountStatus, UserAccount } from "@/types";

export const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

export const STATUS_STYLE: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-amber-100 text-amber-800",
  deactivated: "bg-gray-200 text-gray-700",
};

export const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30";
export const overrideCount = (account: UserAccount) => account.grantedModules.length + account.revokedModules.length;
