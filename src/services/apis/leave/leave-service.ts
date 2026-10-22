import { LEAVE_TYPES } from '@/lib/constants';
import { managerOf } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleLeaveRequests, sampleTeamLeaveRequests } from '@/lib/sample-data/leave-tracker-sample-data';
import { getUserById } from '@/lib/user-directory';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { LeaveAbsence, LeaveRequest } from '@/types';
import { notificationService } from '../notifications/notification-service';

/*
 * Leave requests, shared by the Leave Tracker page, Approvals and the Tasks module.
 * In-memory mock (lasts until refresh); each method mirrors an endpoint in `endpoints.leave*`.
 * A request goes to the person's reporting manager (from the live directory); HR can act on any request.
 * Tasks only ever get approved absences as dates, never the leave type or reason.
 */

export type LeaveRequestInput = Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'appliedDate' | 'approvedBy' | 'approvedDate'>;
export type LeaveDecision = 'approved' | 'rejected';

const MOCK_LATENCY_MS = 150;

let requests: LeaveRequest[] = [...sampleLeaveRequests, ...sampleTeamLeaveRequests].map((request) => ({ ...request }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

const nameOf = (userId: string) => getUserById(userId)?.name ?? 'Someone';
const typeLabel = (type: LeaveRequest['leaveType']) => LEAVE_TYPES.find((entry) => entry.id === type)?.label ?? 'Leave';

// The reporting manager decides; HR can step in for anyone (e.g. when the manager is away). Nobody decides their own.
export const canDecideLeave = (actor: PermissionUser, request: Pick<LeaveRequest, 'userId'>) =>
  request.userId !== actor.id && (managerOf(request.userId) === actor.id || actor.role === 'hr');

export const leaveService = {
  // GET /api/leave/requests — the caller's own requests
  async list(actor: PermissionUser): Promise<LeaveRequest[]> {
    await delay();
    return requests.filter((request) => request.userId === actor.id);
  },

  // GET /api/leave/requests?scope=approver — requests the caller can decide (their team's, or everyone's for HR)
  async listForApprover(actor: PermissionUser): Promise<LeaveRequest[]> {
    await delay();
    return requests.filter((request) => canDecideLeave(actor, request));
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
    const manager = managerOf(actor.id);
    if (manager) {
      notificationService.notify([manager], actor.id, {
        title: `${nameOf(actor.id)} applied for ${typeLabel(request.leaveType)}`,
        message: `${request.startDate}${request.endDate !== request.startDate ? ` to ${request.endDate}` : ''}: ${request.reason}`,
        type: 'info',
        actionUrl: '/approvals',
      });
    }
    return request;
  },

  // POST /api/leave/requests/:id/decision — the employee is told either way
  async decide(actor: PermissionUser, requestId: string, decision: LeaveDecision): Promise<LeaveRequest> {
    await delay();
    const request = requests.find((entry) => entry.id === requestId);
    if (!request) throw new Error('This leave request no longer exists');
    if (!canDecideLeave(actor, request)) throw new Error("You can't decide on this request");
    if (request.status !== 'pending') throw new Error(`This request was already ${request.status}`);
    const decided: LeaveRequest = { ...request, status: decision, approvedBy: nameOf(actor.id), approvedDate: todayAsDateInput() };
    requests = requests.map((entry) => (entry.id === requestId ? decided : entry));
    notificationService.notify([request.userId], actor.id, {
      title: `Your ${typeLabel(request.leaveType)} was ${decision}`,
      message: `${nameOf(actor.id)} ${decision} your leave from ${request.startDate}${request.endDate !== request.startDate ? ` to ${request.endDate}` : ''}.`,
      type: decision === 'approved' ? 'success' : 'warning',
      actionUrl: '/leave',
    });
    return decided;
  },

  // GET /api/leave/absences — approved leave for everyone, dates only (used for task due-date warnings)
  async listAbsences(): Promise<LeaveAbsence[]> {
    await delay();
    return requests
      .filter((request) => request.status === 'approved')
      .map(({ userId, startDate, endDate }) => ({ userId, startDate, endDate }));
  },
};
