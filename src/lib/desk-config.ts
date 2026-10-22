import type { UserRole } from '@/lib/mock-users';
import type {
  AssetStatus,
  AssetType,
  DeskId,
  DeskSettings,
  ExpenseCategory,
  RequestCategory,
  RequestStatus,
  WaitingReason,
} from '@/types';

/* Names, defaults and formatting for the service desk, shared by services and screens. */

export interface Desk {
  id: DeskId;
  // Who it is, as people say it: "Admin team"
  team: string;
  // Short label for badges and choices
  label: string;
  // One line on what to ask them for
  summary: string;
  // Prefix of request keys, e.g. ADM-104
  keyPrefix: string;
  // Roles whose members work this desk's queue (they also need request.manage)
  roles: UserRole[];
  categories: RequestCategory[];
}

/*
 * The teams people can raise requests with. Each category belongs to one desk, so routing, queues,
 * assignment and notifications all follow from here; a new team is a new entry, with no screen changes.
 */
export const DESKS: Desk[] = [
  {
    id: 'admin',
    team: 'Admin team',
    label: 'Admin',
    summary: 'Office: laptops and equipment, facilities, supplies, cabs, travel and visitors',
    keyPrefix: 'ADM',
    roles: ['admin'],
    categories: ['asset', 'facility', 'supplies', 'transport', 'travel', 'visitor', 'other'],
  },
  {
    id: 'system',
    team: 'System Admin team',
    label: 'System Admin',
    summary: 'Logins and passwords, page or role access, software and accounts',
    keyPrefix: 'SYS',
    roles: ['system_admin'],
    categories: ['account', 'access', 'software', 'system-other'],
  },
];

export const REQUEST_CATEGORIES: RequestCategory[] = DESKS.flatMap((desk) => desk.categories);

export const getDesk = (id: DeskId): Desk => DESKS.find((desk) => desk.id === id)!;
// The desk that handles a category
export const deskOf = (category: RequestCategory): Desk => DESKS.find((desk) => desk.categories.includes(category)) ?? DESKS[0];

export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  asset: 'Asset',
  facility: 'Facility',
  supplies: 'Supplies',
  transport: 'Transport',
  travel: 'Travel',
  visitor: 'Visitor',
  other: 'Other',
  account: 'Login & password',
  access: 'Access & permissions',
  software: 'Software & tools',
  'system-other': 'Other system issue',
};

export const REQUEST_CATEGORY_HINTS: Record<RequestCategory, string> = {
  asset: 'Laptop, monitor, headset, ID or access card',
  facility: 'AC, lights, seating, meeting rooms, repairs',
  supplies: 'Stationery, pantry, printer paper and toner',
  transport: 'Cab pick-up or drop, parking',
  travel: 'Flight, train and hotel bookings',
  visitor: 'Guest passes and front-desk arrangements',
  other: 'Anything else for the Admin team',
  account: "Can't log in, locked account, password reset, new account",
  access: 'Access to a page, module or project, or a role change',
  software: 'Install or licence software, email, VPN or tool access',
  'system-other': 'Anything else for the System Admin team',
};

export const REQUEST_STATUSES: RequestStatus[] = ['open', 'in-progress', 'waiting', 'resolved', 'closed'];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Open',
  'in-progress': 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const WAITING_REASON_LABELS: Record<WaitingReason, string> = {
  vendor: 'Waiting for vendor',
  approval: 'Waiting for approval',
};

export const ASSET_TYPES: AssetType[] = ['laptop', 'monitor', 'headset', 'phone', 'id-card', 'access-card', 'other'];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  laptop: 'Laptop',
  monitor: 'Monitor',
  headset: 'Headset',
  phone: 'Phone',
  'id-card': 'ID card',
  'access-card': 'Access card',
  other: 'Other',
};

// Prefix for new asset tags, e.g. LAP-0007
export const ASSET_TAG_PREFIX: Record<AssetType, string> = {
  laptop: 'LAP',
  monitor: 'MON',
  headset: 'HDS',
  phone: 'PHN',
  'id-card': 'IDC',
  'access-card': 'ACC',
  other: 'AST',
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  'in-stock': 'In stock',
  issued: 'Issued',
  'in-repair': 'In repair',
  retired: 'Retired',
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['asset', 'facility', 'maintenance', 'supplies', 'utilities', 'transport', 'travel', 'visitor', 'events', 'other'];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ...REQUEST_CATEGORY_LABELS,
  asset: 'Assets & equipment',
  supplies: 'Office supplies',
  maintenance: 'Maintenance & repairs',
  utilities: 'Utilities',
  events: 'Events & celebrations',
};

export const DEFAULT_DESK_SETTINGS: DeskSettings = {
  // Hours to first response / to resolution
  sla: {
    asset: { responseHours: 4, resolutionHours: 48 },
    facility: { responseHours: 2, resolutionHours: 24 },
    supplies: { responseHours: 4, resolutionHours: 24 },
    transport: { responseHours: 1, resolutionHours: 8 },
    travel: { responseHours: 4, resolutionHours: 48 },
    visitor: { responseHours: 1, resolutionHours: 4 },
    other: { responseHours: 8, resolutionHours: 72 },
    account: { responseHours: 1, resolutionHours: 4 },
    access: { responseHours: 4, resolutionHours: 24 },
    software: { responseHours: 4, resolutionHours: 48 },
    'system-other': { responseHours: 8, resolutionHours: 72 },
  },
  // Monthly budgets in rupees
  budgets: {
    asset: 250000,
    facility: 60000,
    maintenance: 40000,
    supplies: 30000,
    utilities: 90000,
    transport: 45000,
    travel: 120000,
    visitor: 10000,
    events: 35000,
    other: 15000,
  },
};

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatRupees = (amount: number) => rupees.format(amount);

// Share of budget used before it is flagged as nearly spent
export const BUDGET_WARNING_SHARE = 0.8;
