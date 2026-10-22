import { toDateInput } from '@/lib/utils';
import type { AdminRequest, Asset, AssetHistoryEntry, Expense, RequestActivity, RequestComment, TaskUser } from '@/types';

/*
 * Demo data for the Admin service desk, relative to today so SLA timers are live.
 * With the backend this comes from /api/service-desk/*, /api/assets and /api/expenses.
 */

const HOUR_MS = 60 * 60 * 1000;
const hoursAgo = (hours: number) => new Date(Date.now() - hours * HOUR_MS).toISOString();
const daysAgoDate = (days: number) => toDateInput(new Date(Date.now() - days * 24 * HOUR_MS));

// The Admin (office operations) team besides the Admin login user
export const deskStaff: TaskUser[] = [
  { id: 'ADM002', name: 'Ravi Teja', email: 'ravi.teja@company.com', role: 'admin', department: 'Operations', designation: 'Facilities Executive', managerId: 'ADM001' },
  { id: 'ADM003', name: 'Lakshmi Narayan', email: 'lakshmi.narayan@company.com', role: 'admin', department: 'Operations', designation: 'Admin Assistant', managerId: 'ADM001' },
];

interface SampleRequest extends Omit<AdminRequest, 'id' | 'createdAt' | 'updatedAt' | 'firstResponseAt' | 'resolvedAt' | 'closedAt' | 'waitingSince' | 'pausedMs' | 'attachments' | 'source'> {
  createdHoursAgo: number;
  respondedHoursAgo?: number;
  resolvedHoursAgo?: number;
  closedHoursAgo?: number;
  waitingHoursAgo?: number;
  pausedHours?: number;
}

const requests: SampleRequest[] = [
  // Live queue
  { key: 'ADM-101', category: 'asset', title: 'Laptop battery drains within 2 hours', description: 'My Dell Latitude (LAP-0001) goes from full to empty in about two hours, even with only the browser open.', priority: 'high', status: 'in-progress', requesterId: 'EMP001', assigneeId: 'ADM002', createdHoursAgo: 30, respondedHoursAgo: 28 },
  // System Admin team: logins, access and software
  { key: 'SYS-109', category: 'access', title: 'Access to the Reports page', description: 'I need the Reports page to prepare the monthly delivery summary for my team.', priority: 'medium', status: 'open', requesterId: 'EMP002', createdHoursAgo: 3 },
  { key: 'SYS-110', category: 'account', title: "Can't log in after password change", description: 'My account says the password is wrong even though I changed it this morning.', priority: 'high', status: 'in-progress', requesterId: 'EMP005', assigneeId: 'SYS001', createdHoursAgo: 2, respondedHoursAgo: 1.5 },
  { key: 'ADM-102', category: 'facility', title: 'AC not working in Meeting Room 3', description: 'The AC in Meeting Room 3 blows warm air. We have client calls there all afternoon.', priority: 'high', status: 'open', requesterId: 'EMP003', createdHoursAgo: 5 },
  { key: 'ADM-103', category: 'supplies', title: 'Printer toner empty on the 2nd floor', description: 'The HP printer near the pantry shows "toner empty".', priority: 'medium', status: 'waiting', waitingReason: 'vendor', requesterId: 'EMP004', assigneeId: 'ADM003', createdHoursAgo: 20, respondedHoursAgo: 19, waitingHoursAgo: 12 },
  { key: 'ADM-104', category: 'travel', title: 'Flight to Bengaluru for client workshop', description: 'Return flight Chennai ↔ Bengaluru, leaving next Tuesday morning and back Wednesday evening.', priority: 'medium', status: 'waiting', waitingReason: 'approval', requesterId: 'PM001', assigneeId: 'ADM001', createdHoursAgo: 26, respondedHoursAgo: 24, waitingHoursAgo: 20 },
  { key: 'ADM-105', category: 'transport', title: 'Late-night cab drop on Friday', description: 'Release deployment runs late on Friday; need a cab drop to Velachery around 11:30 PM.', priority: 'medium', status: 'in-progress', requesterId: 'EMP006', assigneeId: 'ADM002', createdHoursAgo: 9, respondedHoursAgo: 8.5 },
  { key: 'ADM-106', category: 'visitor', title: 'Visitor passes for the client team (3 people)', description: 'Three visitors from Northwind arriving tomorrow at 10 AM for the sprint demo.', priority: 'medium', status: 'open', requesterId: 'PM001', createdHoursAgo: 0.5 },
  { key: 'ADM-107', category: 'asset', title: 'Second monitor for design work', description: 'A 27" monitor would help with the new design system work in Figma.', priority: 'low', status: 'in-progress', requesterId: 'EMP004', assigneeId: 'ADM001', createdHoursAgo: 40, respondedHoursAgo: 39 },
  { key: 'ADM-108', category: 'other', title: 'Locker key replacement', description: 'I lost the key for locker 42 on the ground floor.', priority: 'low', status: 'open', requesterId: 'EMP007', createdHoursAgo: 2 },
  // Recently resolved
  { key: 'ADM-096', category: 'facility', title: 'Chair hydraulic broken', description: 'My chair keeps sinking to the lowest position.', priority: 'medium', status: 'resolved', requesterId: 'EMP002', assigneeId: 'ADM002', createdHoursAgo: 70, respondedHoursAgo: 69, resolvedHoursAgo: 50 },
  { key: 'ADM-097', category: 'supplies', title: 'Notebooks and pens for new interns', description: 'Six interns join on Monday; please keep a stationery kit ready for each.', priority: 'medium', status: 'resolved', requesterId: 'HR001', assigneeId: 'ADM003', createdHoursAgo: 60, respondedHoursAgo: 57, resolvedHoursAgo: 28 },
  // History (closed) for reports
  { key: 'ADM-090', category: 'asset', title: 'Headset microphone not working', description: 'Others cannot hear me on calls.', priority: 'medium', status: 'closed', requesterId: 'EMP005', assigneeId: 'ADM003', createdHoursAgo: 12 * 24, respondedHoursAgo: 12 * 24 - 2, resolvedHoursAgo: 11 * 24 - 2, closedHoursAgo: 4 * 24 },
  { key: 'ADM-088', category: 'travel', title: 'Train tickets to Chennai', description: 'For the family day event.', priority: 'low', status: 'closed', requesterId: 'EMP002', assigneeId: 'ADM001', createdHoursAgo: 16 * 24, respondedHoursAgo: 16 * 24 - 3, resolvedHoursAgo: 14 * 24 + 8, closedHoursAgo: 7 * 24 },
  { key: 'ADM-085', category: 'transport', title: 'Airport pick-up for the board meeting', description: 'Arriving 6:40 AM on the Mumbai flight.', priority: 'high', status: 'closed', requesterId: 'EXE001', assigneeId: 'ADM002', createdHoursAgo: 20 * 24, respondedHoursAgo: 20 * 24 - 0.5, resolvedHoursAgo: 20 * 24 - 6, closedHoursAgo: 13 * 24 },
  { key: 'ADM-082', category: 'facility', title: 'Water leak under the pantry sink', description: 'Water pooling on the floor near the coffee machine.', priority: 'urgent', status: 'closed', requesterId: 'EMP003', assigneeId: 'ADM002', createdHoursAgo: 25 * 24, respondedHoursAgo: 25 * 24 - 1, resolvedHoursAgo: 25 * 24 - 30, closedHoursAgo: 18 * 24 },
  { key: 'ADM-080', category: 'visitor', title: 'Visitor passes for interview candidates', description: 'Eight candidates for the campus drive.', priority: 'medium', status: 'closed', requesterId: 'HR001', assigneeId: 'ADM003', createdHoursAgo: 30 * 24, respondedHoursAgo: 30 * 24 - 0.5, resolvedHoursAgo: 30 * 24 - 3, closedHoursAgo: 23 * 24 },
  { key: 'ADM-078', category: 'other', title: 'Parking sticker for new car', description: 'Registration TN 09 AB 1234.', priority: 'low', status: 'closed', requesterId: 'EMP006', assigneeId: 'ADM001', createdHoursAgo: 35 * 24, respondedHoursAgo: 35 * 24 - 5, resolvedHoursAgo: 35 * 24 - 50, closedHoursAgo: 28 * 24 },
  { key: 'ADM-075', category: 'asset', title: 'Replace cracked laptop screen', description: 'Screen cracked after a fall.', priority: 'high', status: 'closed', requesterId: 'EMP002', assigneeId: 'ADM002', createdHoursAgo: 40 * 24, respondedHoursAgo: 40 * 24 - 6, resolvedHoursAgo: 40 * 24 - 60, closedHoursAgo: 33 * 24 },
  { key: 'ADM-072', category: 'supplies', title: 'Pantry restock: coffee and tea', description: 'Coffee beans and green tea are out.', priority: 'low', status: 'closed', requesterId: 'EMP007', assigneeId: 'ADM003', createdHoursAgo: 44 * 24, respondedHoursAgo: 44 * 24 - 2, resolvedHoursAgo: 44 * 24 - 20, closedHoursAgo: 37 * 24 },
];

export const sampleRequests: AdminRequest[] = requests.map(
  ({ createdHoursAgo, respondedHoursAgo, resolvedHoursAgo, closedHoursAgo, waitingHoursAgo, pausedHours = 0, ...request }, index) => ({
    ...request,
    id: `REQ-${index + 1}`,
    attachments: [],
    source: 'manual',
    createdAt: hoursAgo(createdHoursAgo),
    updatedAt: hoursAgo(Math.min(createdHoursAgo, waitingHoursAgo ?? Infinity, respondedHoursAgo ?? Infinity, resolvedHoursAgo ?? Infinity, closedHoursAgo ?? Infinity)),
    firstResponseAt: respondedHoursAgo !== undefined ? hoursAgo(respondedHoursAgo) : undefined,
    resolvedAt: resolvedHoursAgo !== undefined ? hoursAgo(resolvedHoursAgo) : undefined,
    closedAt: closedHoursAgo !== undefined ? hoursAgo(closedHoursAgo) : undefined,
    waitingSince: waitingHoursAgo !== undefined ? hoursAgo(waitingHoursAgo) : undefined,
    pausedMs: pausedHours * HOUR_MS,
    // Old breaches were already handled
    breachNotified: request.status === 'closed' || request.status === 'resolved' ? { response: true, resolution: true } : undefined,
  }),
);

const requestId = (key: string) => sampleRequests.find((request) => request.key === key)!.id;

export const sampleRequestComments: RequestComment[] = [
  { id: 'RC-1', requestId: requestId('ADM-101'), authorId: 'ADM002', body: 'Thanks Kalai. I have a replacement battery on order; meanwhile you can use the spare LAP-0005 if it gets worse.', internal: false, createdAt: hoursAgo(28) },
  { id: 'RC-2', requestId: requestId('ADM-101'), authorId: 'EMP001', body: 'Thank you! I can manage with the charger for now.', internal: false, createdAt: hoursAgo(27) },
  { id: 'RC-3', requestId: requestId('ADM-103'), authorId: 'ADM003', body: 'Ordered 2 toner cartridges from Sri Ganesh Traders, delivery expected tomorrow.', internal: false, createdAt: hoursAgo(12) },
  { id: 'RC-4', requestId: requestId('ADM-104'), authorId: 'ADM001', body: 'Fare is higher than usual for this route. Waiting for the department head to approve before booking.', internal: true, createdAt: hoursAgo(20) },
  { id: 'RC-5', requestId: requestId('ADM-104'), authorId: 'ADM001', body: 'We are getting the fare approved and will book as soon as it comes through.', internal: false, createdAt: hoursAgo(20) },
  { id: 'RC-6', requestId: requestId('ADM-096'), authorId: 'ADM002', body: 'Replaced the gas lift. Let us know if it sinks again.', internal: false, createdAt: hoursAgo(50) },
];

export const sampleRequestActivity: RequestActivity[] = sampleRequests.flatMap((request) => [
  { id: `RA-${request.id}-1`, requestId: request.id, actorId: request.requesterId, summary: 'Raised the request', createdAt: request.createdAt },
  ...(request.assigneeId && request.firstResponseAt
    ? [{ id: `RA-${request.id}-2`, requestId: request.id, actorId: request.assigneeId, summary: 'Picked it up and moved it to In Progress', createdAt: request.firstResponseAt }]
    : []),
  ...(request.waitingSince
    ? [{ id: `RA-${request.id}-3`, requestId: request.id, actorId: request.assigneeId ?? 'system', summary: `Waiting for ${request.waitingReason === 'vendor' ? 'vendor' : 'approval'}`, createdAt: request.waitingSince }]
    : []),
  ...(request.resolvedAt ? [{ id: `RA-${request.id}-4`, requestId: request.id, actorId: request.assigneeId ?? 'system', summary: 'Resolved', createdAt: request.resolvedAt }] : []),
  ...(request.closedAt ? [{ id: `RA-${request.id}-5`, requestId: request.id, actorId: 'system', summary: 'Closed automatically after 7 days', createdAt: request.closedAt }] : []),
]);

/* ---------- Assets ---------- */

const issued = (userId: string, daysAgo: number, actorId = 'ADM001'): AssetHistoryEntry => ({ id: `AH-${userId}-${daysAgo}`, action: 'issued', userId, actorId, at: hoursAgo(daysAgo * 24) });
const added = (daysAgo: number): AssetHistoryEntry => ({ id: `AH-add-${daysAgo}`, action: 'added', actorId: 'ADM001', at: hoursAgo(daysAgo * 24) });

type SampleAsset = Omit<Asset, 'id' | 'history' | 'issuedAt'> & { issuedDaysAgo?: number; addedDaysAgo: number; extra?: AssetHistoryEntry[] };

const assets: SampleAsset[] = [
  { tag: 'LAP-0001', type: 'laptop', model: 'Dell Latitude 5440', serialNumber: 'DL5440-7H2K9', status: 'issued', assignedToId: 'EMP001', issuedDaysAgo: 400, addedDaysAgo: 410 },
  { tag: 'LAP-0002', type: 'laptop', model: 'Apple MacBook Pro 14"', serialNumber: 'C02FK3MDQ6L4', status: 'issued', assignedToId: 'EMP004', issuedDaysAgo: 300, addedDaysAgo: 305 },
  { tag: 'LAP-0003', type: 'laptop', model: 'Lenovo ThinkPad T14', serialNumber: 'PF3X9KQ2', status: 'issued', assignedToId: 'EMP002', issuedDaysAgo: 720, addedDaysAgo: 730 },
  { tag: 'LAP-0004', type: 'laptop', model: 'Dell Latitude 5440', serialNumber: 'DL5440-2M8Q1', status: 'issued', assignedToId: 'EMP003', issuedDaysAgo: 500, addedDaysAgo: 505 },
  { tag: 'LAP-0005', type: 'laptop', model: 'Lenovo ThinkPad T14', serialNumber: 'PF3Y1LR7', status: 'in-stock', addedDaysAgo: 60 },
  { tag: 'LAP-0006', type: 'laptop', model: 'Dell Latitude 5430', serialNumber: 'DL5430-9P4T3', status: 'in-repair', addedDaysAgo: 900, extra: [{ id: 'AH-rep-1', action: 'repair', actorId: 'ADM002', note: 'Keyboard replacement at the Dell service centre', at: hoursAgo(5 * 24) }] },
  { tag: 'LAP-0007', type: 'laptop', model: 'Dell Latitude 5440', serialNumber: 'DL5440-4R7W2', status: 'issued', assignedToId: 'EMP005', issuedDaysAgo: 380, addedDaysAgo: 385 },
  { tag: 'MON-0001', type: 'monitor', model: 'Dell P2423 24"', status: 'issued', assignedToId: 'EMP004', issuedDaysAgo: 300, addedDaysAgo: 305 },
  { tag: 'MON-0002', type: 'monitor', model: 'Dell P2723 27"', status: 'in-stock', addedDaysAgo: 30 },
  { tag: 'HDS-0001', type: 'headset', model: 'Jabra Evolve2 40', status: 'issued', assignedToId: 'EMP005', issuedDaysAgo: 11, addedDaysAgo: 120 },
  { tag: 'HDS-0002', type: 'headset', model: 'Jabra Evolve2 40', status: 'in-stock', addedDaysAgo: 120 },
  { tag: 'IDC-0001', type: 'id-card', model: 'Employee ID card', status: 'issued', assignedToId: 'EMP001', issuedDaysAgo: 400, addedDaysAgo: 400 },
  { tag: 'IDC-0002', type: 'id-card', model: 'Employee ID card', status: 'issued', assignedToId: 'EMP002', issuedDaysAgo: 720, addedDaysAgo: 720 },
  { tag: 'IDC-0003', type: 'id-card', model: 'Employee ID card', status: 'issued', assignedToId: 'EMP003', issuedDaysAgo: 500, addedDaysAgo: 500 },
  { tag: 'ACC-0001', type: 'access-card', model: 'Floor 2 access card', status: 'issued', assignedToId: 'EMP006', issuedDaysAgo: 200, addedDaysAgo: 200 },
  { tag: 'ACC-0002', type: 'access-card', model: 'Floor 2 access card', status: 'in-stock', addedDaysAgo: 200 },
  { tag: 'PHN-0001', type: 'phone', model: 'Samsung Galaxy A34 (test device)', status: 'retired', addedDaysAgo: 800, extra: [{ id: 'AH-ret-1', action: 'retired', actorId: 'ADM001', note: 'Battery swollen', at: hoursAgo(40 * 24) }] },
];

export const sampleAssets: Asset[] = assets.map(({ issuedDaysAgo, addedDaysAgo, extra = [], ...asset }, index) => ({
  ...asset,
  id: `AST-${index + 1}`,
  issuedAt: issuedDaysAgo !== undefined ? hoursAgo(issuedDaysAgo * 24) : undefined,
  history: [added(addedDaysAgo), ...(issuedDaysAgo !== undefined && asset.assignedToId ? [issued(asset.assignedToId, issuedDaysAgo)] : []), ...extra].map((entry, position) => ({
    ...entry,
    id: `${entry.id}-${index}-${position}`,
  })),
}));

/* ---------- Office expenses ---------- */

type SampleExpense = Omit<Expense, 'id' | 'date' | 'createdAt' | 'recordedById'> & { daysAgo: number };

// Spread over this month and the two before it; utilities run over budget this month, facility is close
const expenses: SampleExpense[] = [
  { daysAgo: 2, category: 'utilities', vendor: 'TANGEDCO', amount: 68400, description: 'Electricity bill' },
  { daysAgo: 3, category: 'utilities', vendor: 'ACT Fibernet', amount: 24500, description: 'Leased line and Wi-Fi' },
  { daysAgo: 1, category: 'supplies', vendor: 'Sri Ganesh Traders', amount: 7800, description: 'Printer toner ×2', requestKey: 'ADM-103' },
  { daysAgo: 4, category: 'facility', vendor: 'CoolTech Services', amount: 32000, description: 'AC servicing, all floors' },
  { daysAgo: 6, category: 'facility', vendor: 'Urban Interiors', amount: 18500, description: 'Meeting room chairs ×4' },
  { daysAgo: 2, category: 'maintenance', vendor: 'QuickFix Plumbing', amount: 4200, description: 'Pantry tap replacement' },
  { daysAgo: 5, category: 'transport', vendor: 'Fast Track Cabs', amount: 15600, description: 'Late-night drops, week 2' },
  { daysAgo: 7, category: 'travel', vendor: 'MakeMyTrip Business', amount: 18900, description: 'Client visit flights', requestKey: 'ADM-088' },
  { daysAgo: 3, category: 'asset', vendor: 'Dell Technologies', amount: 84500, description: 'Dell Latitude 5440 laptop' },
  { daysAgo: 8, category: 'events', vendor: 'Cake Square', amount: 6400, description: 'Birthday celebrations' },
  { daysAgo: 9, category: 'supplies', vendor: 'Amazon Business', amount: 11200, description: 'Stationery kits for interns', requestKey: 'ADM-097' },
  { daysAgo: 1, category: 'visitor', vendor: 'Print Hub', amount: 2400, description: 'Visitor badges' },
  // Last month
  { daysAgo: 33, category: 'utilities', vendor: 'TANGEDCO', amount: 61200, description: 'Electricity bill' },
  { daysAgo: 34, category: 'utilities', vendor: 'ACT Fibernet', amount: 24500, description: 'Leased line and Wi-Fi' },
  { daysAgo: 36, category: 'facility', vendor: 'CleanPro Facility Services', amount: 28000, description: 'Deep cleaning' },
  { daysAgo: 38, category: 'travel', vendor: 'IRCTC', amount: 6200, description: 'Team train tickets' },
  { daysAgo: 40, category: 'asset', vendor: 'Jabra India', amount: 21000, description: 'Headsets ×3' },
  { daysAgo: 41, category: 'transport', vendor: 'Fast Track Cabs', amount: 38200, description: 'Monthly cab contract' },
  { daysAgo: 45, category: 'events', vendor: 'The Grand Banquet', amount: 42000, description: 'Quarterly town hall' },
  // Two months ago
  { daysAgo: 63, category: 'utilities', vendor: 'TANGEDCO', amount: 58800, description: 'Electricity bill' },
  { daysAgo: 64, category: 'utilities', vendor: 'ACT Fibernet', amount: 24500, description: 'Leased line and Wi-Fi' },
  { daysAgo: 66, category: 'asset', vendor: 'Dell Technologies', amount: 169000, description: 'Laptops ×2 for new joiners' },
  { daysAgo: 70, category: 'supplies', vendor: 'Amazon Business', amount: 9600, description: 'Pantry restock' },
  { daysAgo: 72, category: 'transport', vendor: 'Fast Track Cabs', amount: 36400, description: 'Monthly cab contract' },
];

export const sampleExpenses: Expense[] = expenses.map(({ daysAgo, ...expense }, index) => ({
  ...expense,
  id: `EXP-${index + 1}`,
  date: daysAgoDate(daysAgo),
  recordedById: index % 3 === 0 ? 'ADM003' : 'ADM001',
  createdAt: hoursAgo(daysAgo * 24),
}));
