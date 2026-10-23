import { CalendarPlus, CheckCheck, LifeBuoy, ListPlus, Timer, TrendingUp, Upload, Users, Wallet, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { hasModuleAccess } from '@/lib/modules';
import { can, type PermissionUser } from '@/lib/permissions/task-permissions';

/*
 * One list of shortcuts, used by the header's Quick Add menu and the dashboard's Quick Actions.
 * A "create" action opens the page with ?new=1, and the page opens its own form (see useCreateFromLink),
 * so a new action is one entry here plus that hook on its page. Each shows only if the person can open the page.
 */

export const CREATE_PARAM = 'new';

export interface QuickAction {
  id: string;
  label: string;
  // One short line, shown in the Quick Add menu
  description: string;
  icon: LucideIcon;
  path: string;
  // Opens the page's form straight away rather than just the page
  creates?: boolean;
  // Icon tile colours
  tone: string;
  // Extra check beyond opening the page (e.g. creating tasks needs task.create)
  allowed?: (user: PermissionUser) => boolean;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: 'task', label: 'Add Task', description: 'Create a task and assign it', icon: ListPlus, path: ROUTES.Tasks, creates: true, tone: 'bg-blue-50 text-blue-600', allowed: (user) => can(user, 'task.create') },
  { id: 'request', label: 'Raise a Request', description: 'Ask the Admin or System Admin team', icon: LifeBuoy, path: ROUTES.ServiceDesk, creates: true, tone: 'bg-indigo-50 text-indigo-600' },
  { id: 'leave', label: 'Apply Leave', description: 'Request time off', icon: CalendarPlus, path: ROUTES.Leave, creates: true, tone: 'bg-green-50 text-green-600' },
  { id: 'time', label: 'Log Time', description: 'Add a time entry', icon: Timer, path: ROUTES.TimeTracker, creates: true, tone: 'bg-sky-50 text-sky-600' },
  { id: 'file', label: 'Upload File', description: 'Share a document', icon: Upload, path: ROUTES.Files, creates: true, tone: 'bg-purple-50 text-purple-600' },
  // Plain shortcuts (dashboard only)
  { id: 'approvals', label: 'Approvals', description: 'Requests waiting on you', icon: CheckCheck, path: ROUTES.Approvals, tone: 'bg-amber-50 text-amber-600' },
  { id: 'team', label: 'View Team', description: 'Org chart and directory', icon: Users, path: ROUTES.Organization, tone: 'bg-orange-50 text-orange-600' },
  { id: 'payslips', label: 'Payslips', description: 'Salary and tax', icon: Wallet, path: ROUTES.Pay, tone: 'bg-teal-50 text-teal-600' },
  { id: 'reports', label: 'Reports', description: 'Reports and charts', icon: TrendingUp, path: ROUTES.Reports, tone: 'bg-red-50 text-red-600' },
];

// Where an action goes: create actions open their form
export const quickActionLink = (action: QuickAction) => (action.creates ? `${action.path}?${CREATE_PARAM}=1` : action.path);

// The actions this person can use; createOnly for the Quick Add menu
export function quickActionsFor(user: PermissionUser | null | undefined, createOnly = false): QuickAction[] {
  if (!user) return [];
  return QUICK_ACTIONS.filter((action) => (!createOnly || action.creates) && hasModuleAccess(user, action.path) && (action.allowed?.(user) ?? true));
}
