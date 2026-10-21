import type { Holiday, LeaveCountry, LeaveRequest } from '@/types';

// Total days allotted per leave type for the current year; null means no limit (unpaid leave)
export const LEAVE_BALANCE: Record<LeaveRequest['leaveType'], number | null> = {
  casual: 12,
  sick: 7,
  earned: 15,
  'loss-of-pay': null,
  'compensatory-off': 3,
  permission: 4,
  marriage: 5,
  paternity: 15,
  maternity: 90,
  'restricted-holiday': 1,
  // 1 day on the loss of a close family member
  bereavement: 1,
  // Extended time away (study, travel, personal); needs manager and HR approval
  sabbatical: 30,
};

export const sampleLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    userId: 'EMP001',
    leaveType: 'casual',
    startDate: '2026-11-16',
    startDayPart: 'full-day',
    endDate: '2026-11-18',
    endDayPart: 'full-day',
    days: 3,
    reason: 'Family function',
    status: 'pending',
    appliedDate: '2026-10-14',
  },
  {
    id: '2',
    userId: 'EMP001',
    leaveType: 'sick',
    startDate: '2026-10-09',
    startDayPart: 'first-half',
    endDate: '2026-10-09',
    endDayPart: 'first-half',
    days: 0.5,
    reason: 'Doctor appointment',
    status: 'approved',
    appliedDate: '2026-10-08',
    approvedBy: 'Jane Smith',
    approvedDate: '2026-10-08',
  },
  {
    id: '3',
    userId: 'EMP001',
    leaveType: 'casual',
    startDate: '2026-10-05',
    startDayPart: 'full-day',
    endDate: '2026-10-06',
    endDayPart: 'full-day',
    days: 2,
    reason: 'Personal work',
    status: 'approved',
    appliedDate: '2026-09-28',
    approvedBy: 'Jane Smith',
    approvedDate: '2026-09-29',
  },
  {
    id: '4',
    userId: 'EMP001',
    leaveType: 'earned',
    startDate: '2026-09-21',
    startDayPart: 'full-day',
    endDate: '2026-09-25',
    endDayPart: 'full-day',
    days: 5,
    reason: 'Vacation',
    status: 'approved',
    appliedDate: '2026-09-01',
    approvedBy: 'Jane Smith',
    approvedDate: '2026-09-02',
  },
  {
    id: '5',
    userId: 'EMP001',
    leaveType: 'casual',
    startDate: '2026-08-10',
    startDayPart: 'full-day',
    endDate: '2026-08-11',
    endDayPart: 'full-day',
    days: 2,
    reason: 'Travel plans',
    status: 'rejected',
    appliedDate: '2026-08-05',
    approvedBy: 'Jane Smith',
    approvedDate: '2026-08-06',
  },
];

// Dates relative to today, so the "assignee on leave" warning on tasks always has something to show
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const approvedTeamLeave = (id: string, userId: string, from: number, to: number, reason: string): LeaveRequest => ({
  id,
  userId,
  leaveType: 'casual',
  startDate: inDays(from),
  startDayPart: 'full-day',
  endDate: inDays(to),
  endDayPart: 'full-day',
  days: to - from + 1,
  reason,
  status: 'approved',
  appliedDate: inDays(-14),
  approvedBy: 'Priya Kumar',
  approvedDate: inDays(-13),
});

// Other people's approved leave (Kalai's own requests are above)
export const sampleTeamLeaveRequests: LeaveRequest[] = [
  approvedTeamLeave('T1', 'EMP001', 9, 10, 'Family event'),
  approvedTeamLeave('T2', 'EMP002', 4, 6, 'Travel'),
  approvedTeamLeave('T3', 'EMP004', -2, 5, 'Medical leave'),
];

export const HOLIDAYS_BY_COUNTRY: Record<LeaveCountry, Holiday[]> = {
  india: [
    { date: '2026-01-01', name: "New Year's Day", type: 'restricted' },
    { date: '2026-01-14', name: 'Pongal / Makar Sankranti', type: 'public' },
    { date: '2026-01-26', name: 'Republic Day', type: 'public' },
    { date: '2026-03-04', name: 'Holi', type: 'public' },
    { date: '2026-03-19', name: 'Ugadi', type: 'restricted' },
    { date: '2026-04-03', name: 'Good Friday', type: 'public' },
    { date: '2026-05-01', name: 'May Day', type: 'public' },
    { date: '2026-08-15', name: 'Independence Day', type: 'public' },
    { date: '2026-08-28', name: 'Raksha Bandhan', type: 'restricted' },
    { date: '2026-09-04', name: 'Janmashtami', type: 'restricted' },
    { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'public' },
    { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'public' },
    { date: '2026-10-20', name: 'Dussehra', type: 'public' },
    { date: '2026-10-29', name: 'Karwa Chauth', type: 'restricted' },
    { date: '2026-11-09', name: 'Diwali', type: 'public' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'restricted' },
    { date: '2026-12-25', name: 'Christmas', type: 'public' },
  ],
  canada: [
    { date: '2026-01-01', name: "New Year's Day", type: 'public' },
    { date: '2026-02-16', name: 'Family Day', type: 'restricted' },
    { date: '2026-04-03', name: 'Good Friday', type: 'public' },
    { date: '2026-05-18', name: 'Victoria Day', type: 'public' },
    { date: '2026-07-01', name: 'Canada Day', type: 'public' },
    { date: '2026-08-03', name: 'Civic Holiday', type: 'restricted' },
    { date: '2026-09-07', name: 'Labour Day', type: 'public' },
    { date: '2026-09-30', name: 'National Day for Truth and Reconciliation', type: 'restricted' },
    { date: '2026-10-12', name: 'Thanksgiving', type: 'public' },
    { date: '2026-11-11', name: 'Remembrance Day', type: 'restricted' },
    { date: '2026-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2026-12-28', name: 'Boxing Day (observed)', type: 'restricted' },
  ],
  'united-states': [
    { date: '2026-01-01', name: "New Year's Day", type: 'public' },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day', type: 'public' },
    { date: '2026-02-16', name: "Presidents' Day", type: 'restricted' },
    { date: '2026-05-25', name: 'Memorial Day', type: 'public' },
    { date: '2026-06-19', name: 'Juneteenth', type: 'public' },
    { date: '2026-07-03', name: 'Independence Day (observed)', type: 'public' },
    { date: '2026-09-07', name: 'Labor Day', type: 'public' },
    { date: '2026-10-12', name: 'Columbus Day', type: 'restricted' },
    { date: '2026-11-11', name: 'Veterans Day', type: 'restricted' },
    { date: '2026-11-26', name: 'Thanksgiving Day', type: 'public' },
    { date: '2026-11-27', name: 'Day after Thanksgiving', type: 'restricted' },
    { date: '2026-12-25', name: 'Christmas Day', type: 'public' },
  ],
};
