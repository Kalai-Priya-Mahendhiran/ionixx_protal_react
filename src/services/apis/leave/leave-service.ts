import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleLeaveRequests, sampleTeamLeaveRequests } from '@/lib/sample-data/leave-tracker-sample-data';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { LeaveAbsence, LeaveRequest } from '@/types';

/*
 * Leave requests, shared by the Leave Tracker page and the Tasks module.
 * In-memory mock (lasts until refresh); each method mirrors an endpoint in `endpoints.leave*`.
 * Tasks only ever get approved absences as dates, never the leave type or reason.
 */

export type LeaveRequestInput = Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'appliedDate' | 'approvedBy' | 'approvedDate'>;

const MOCK_LATENCY_MS = 150;

let requests: LeaveRequest[] = [...sampleLeaveRequests, ...sampleTeamLeaveRequests].map((request) => ({ ...request }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

export const leaveService = {
  // GET /api/leave/requests — the caller's own requests
  async list(actor: PermissionUser): Promise<LeaveRequest[]> {
    await delay();
    return requests.filter((request) => request.userId === actor.id);
  },

  // POST /api/leave/requests
  async apply(actor: PermissionUser, input: LeaveRequestInput): Promise<LeaveRequest> {
    await delay();
    const request: LeaveRequest = {
      ...input,
      reason: input.reason.trim(),
      id: generateId(),
      userId: actor.id,
      status: 'pending',
      appliedDate: todayAsDateInput(),
    };
    requests = [request, ...requests];
    return request;
  },

  // GET /api/leave/absences — approved leave for everyone, dates only (used for task due-date warnings)
  async listAbsences(): Promise<LeaveAbsence[]> {
    await delay();
    return requests
      .filter((request) => request.status === 'approved')
      .map(({ userId, startDate, endDate }) => ({ userId, startDate, endDate }));
  },
};
