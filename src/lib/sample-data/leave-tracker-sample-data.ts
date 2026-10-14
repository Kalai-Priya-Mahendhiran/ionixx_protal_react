import type { LeaveRequest } from '@/types';

export const sampleLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    userId: '1',
    leaveType: 'casual',
    startDate: '2024-01-20',
    endDate: '2024-01-22',
    reason: 'Personal work',
    status: 'approved',
    appliedDate: '2024-01-10',
    approvedBy: 'Jane Smith',
    approvedDate: '2024-01-12',
  },
  {
    id: '2',
    userId: '1',
    leaveType: 'sick',
    startDate: '2024-01-25',
    endDate: '2024-01-25',
    reason: 'Fever and cold',
    status: 'pending',
    appliedDate: '2024-01-24',
  },
];
