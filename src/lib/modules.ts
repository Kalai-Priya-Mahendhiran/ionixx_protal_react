import { ROUTES } from '@/lib/constants';
import { ROLE_ROUTE_ACCESS, ROLE_SIDEBAR_ITEMS, SIDEBAR_ITEMS, type SidebarItem, type UserRole } from '@/lib/mock-users';
import { getAccessRecord, isUserActive } from '@/lib/user-access-store';

/*
 * Page (module) access: each role gets a default set of pages (ROLE_ROUTE_ACCESS), and System Admin can add
 * or take away pages for one person in User Management. The page guard and the sidebar both ask
 * hasModuleAccess(), so a page someone can't open never shows in their menu.
 * Page access only opens the door: what they can do inside still follows the permission matrix.
 */

export interface PortalModule {
  path: string;
  label: string;
  group: string;
}

// Everyone keeps these
export const CORE_MODULES: string[] = [ROUTES.Dashboard, ROUTES.Profile];

// System pages stay with the System Admin role; they can't be granted to individuals
export const RESTRICTED_MODULES: string[] = [ROUTES.UserManagement, ROUTES.RolesPermissions, ROUTES.SystemConfig, ROUTES.Integrations, ROUTES.Logs];

export const MODULE_CATALOG: PortalModule[] = [
  { path: ROUTES.Dashboard, label: 'Dashboard', group: 'Everyone' },
  { path: ROUTES.Profile, label: 'Profile', group: 'Everyone' },
  { path: ROUTES.Attendance, label: 'Attendance', group: 'Self-service' },
  { path: ROUTES.TimeTracker, label: 'Time Tracker', group: 'Self-service' },
  { path: ROUTES.Leave, label: 'Leave Tracker', group: 'Self-service' },
  { path: ROUTES.Files, label: 'Files', group: 'Self-service' },
  { path: ROUTES.Organization, label: 'Organization', group: 'Self-service' },
  { path: ROUTES.Tasks, label: 'Tasks', group: 'Work' },
  { path: ROUTES.ServiceDesk, label: 'Service Desk / My Requests', group: 'Work' },
  { path: ROUTES.Reports, label: 'Reports', group: 'Work' },
  { path: ROUTES.TeamOverview, label: 'Team Overview', group: 'Team management' },
  { path: ROUTES.Approvals, label: 'Approvals', group: 'Team management' },
  { path: ROUTES.AttendanceMonitoring, label: 'Attendance Monitoring', group: 'Team management' },
  { path: ROUTES.PerformanceReview, label: 'Performance Review', group: 'Team management' },
  { path: ROUTES.EmployeeManagement, label: 'Employee Management', group: 'HR' },
  { path: ROUTES.Recruitment, label: 'Recruitment', group: 'HR' },
  { path: ROUTES.Training, label: 'Training', group: 'HR' },
  { path: ROUTES.Compliance, label: 'Compliance', group: 'HR' },
  { path: ROUTES.Analytics, label: 'Analytics', group: 'Executive' },
  { path: ROUTES.KpiMonitoring, label: 'KPI Monitoring', group: 'Executive' },
  { path: ROUTES.AssetLog, label: 'Asset Log', group: 'Office operations' },
  { path: ROUTES.Expenses, label: 'Expenses', group: 'Office operations' },
  { path: ROUTES.DeskReports, label: 'Desk Reports', group: 'Office operations' },
  { path: ROUTES.UserManagement, label: 'User Management', group: 'System' },
  { path: ROUTES.RolesPermissions, label: 'Roles & Permissions', group: 'System' },
  { path: ROUTES.SystemConfig, label: 'System Config', group: 'System' },
  { path: ROUTES.Integrations, label: 'Integrations', group: 'System' },
  { path: ROUTES.Logs, label: 'Logs', group: 'System' },
];

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
  return [...base, ...extras];
}
