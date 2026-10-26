import { MODULE_CATALOG, ROLE_ROUTE_ACCESS, ROLE_SIDEBAR_ITEMS, ROUTES, SIDEBAR_ITEMS, type PortalModule, type SidebarItem } from '@/lib/constants';
import type { UserRole } from '@/lib/mock-users';
import { isPayrollApprover } from '@/lib/approvers';
import { managesAnyone } from '@/lib/org-chart';
import { getAccessRecord, isUserActive } from '@/lib/user-access-store';

/*
 * Page (module) access: each role gets a default set of pages (ROLE_ROUTE_ACCESS), and System Admin can add
 * or take away pages for one person in User Management. The page guard and the sidebar both ask
 * hasModuleAccess(), so a page someone can't open never shows in their menu.
 * Page access only opens the door: what they can do inside still follows the permission matrix.
 */

type ModuleUser = { id: string; role: UserRole };

// Pages that follow from what someone does rather than their role: anyone with direct reports gets Approvals, Team Overview
// and Performance Review, so a team lead (even with the Employee role) sees their team as soon as someone reports to them.
// Payroll reviewers get Approvals for claims and tax proofs.
const DATA_DRIVEN_MODULES: { path: string; item: SidebarItem; applies: (user: ModuleUser) => boolean }[] = [
  { path: ROUTES.Approvals, item: SIDEBAR_ITEMS.approvals, applies: (user) => managesAnyone(user.id) || isPayrollApprover(user) },
  { path: ROUTES.TeamOverview, item: SIDEBAR_ITEMS.teamOverview, applies: (user) => managesAnyone(user.id) },
  { path: ROUTES.PerformanceReview, item: SIDEBAR_ITEMS.performanceReview, applies: (user) => managesAnyone(user.id) },
];

// Everyone keeps these
export const CORE_MODULES: string[] = [ROUTES.Dashboard, ROUTES.Profile];

// System pages stay with the System Admin role; they can't be granted to individuals
export const RESTRICTED_MODULES: string[] = [ROUTES.UserManagement, ROUTES.RolesPermissions, ROUTES.SystemConfig, ROUTES.Integrations, ROUTES.Logs];

export const getModuleLabel = (path: string) => MODULE_CATALOG.find((module) => module.path === path)?.label ?? path;

export function roleHasModule(role: UserRole, path: string): boolean {
  return ROLE_ROUTE_ACCESS[path]?.includes(role) ?? false;
}

// Can this person open the page? Role default, then their personal grants and removals
export function hasModuleAccess(user: { id: string; role: UserRole } | null | undefined, path: string): boolean {
  if (!user || !isUserActive(user.id)) return false;
  if (CORE_MODULES.includes(path)) return true;
  const record = getAccessRecord(user.id);
  if (record.revokedModules.includes(path)) return false;
  if (record.grantedModules.includes(path) && !RESTRICTED_MODULES.includes(path)) return true;
  if (DATA_DRIVEN_MODULES.some((module) => module.path === path && module.applies(user))) return true;
  return roleHasModule(user.role, path);
}

// Every page the person can open, with a flag for where it comes from
export function getModuleAccess(userId: string, role: UserRole): { module: PortalModule; byRole: boolean; access: boolean }[] {
  return MODULE_CATALOG.map((module) => ({ module, byRole: roleHasModule(role, module.path), access: hasModuleAccess({ id: userId, role }, module.path) }));
}

// The sidebar: the role's usual order, without removed pages, followed by pages granted on top
export function getSidebarItems(user: { id: string; role: UserRole } | null | undefined): SidebarItem[] {
  if (!user) return [];
  const base = ROLE_SIDEBAR_ITEMS[user.role].filter((item) => hasModuleAccess(user, item.path));
  const extras = getAccessRecord(user.id)
    .grantedModules.filter((path) => !base.some((item) => item.path === path) && hasModuleAccess(user, path))
    .map((path) => Object.values(SIDEBAR_ITEMS).find((item) => item.path === path))
    .filter((item): item is (typeof SIDEBAR_ITEMS)[keyof typeof SIDEBAR_ITEMS] => !!item);
  const dataDriven = DATA_DRIVEN_MODULES.filter((module) => ![...base, ...extras].some((item) => item.path === module.path) && hasModuleAccess(user, module.path)).map((module) => module.item);
  return [...base, ...extras, ...dataDriven];
}
