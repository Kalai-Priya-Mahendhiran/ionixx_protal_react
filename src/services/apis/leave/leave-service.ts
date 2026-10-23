import { LEAVE_TYPES } from '@/lib/constants';
import { isLeaveTypeAvailable, leaveTypeUnavailableReason } from '@/lib/leave-eligibility';
import { managerOf } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleLeaveRequests, sampleTeamLeaveRequests } from '@/lib/sample-data/leave-tracker-sample-data';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { isUserActive } from '@/lib/user-access-store';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { LeaveAbsence, LeaveRequest } from '@/types';
import { notificationService } from '../notifications/notification-service';
import { getGenderOf } from '../profile/profile-service';

/*
 * Leave requests, shared by the Leave Tracker page, Approvals and the Tasks module.
 * In-memory mock (lasts until refresh); each method mirrors an endpoint in `endpoints.leave*`.
 * Each request has exactly one decider (see approverOf), so it never sits in two queues at once.
 * Tasks only ever get approved absences as dates, never the leave type or reason.
 */

export type LeaveRequestInput = Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'appliedDate' | 'approvedBy' | 'approvedById' | 'approvedDate' | 'decisionComment'>;
export type LeaveDecision = 'approved' | 'rejected';

const MOCK_LATENCY_MS = 150;

let requests: LeaveRequest[] = [...sampleLeaveRequests, ...sampleTeamLeaveRequests].map((request) => ({ ...request }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

const nameOf = (userId: string) => getUserById(userId)?.name ?? 'Someone';
const typeLabel = (type: LeaveRequest['leaveType']) => LEAVE_TYPES.find((entry) => entry.id === type)?.label ?? 'Leave';

// On approved leave today (an away manager can't act on requests)
export const isOnLeaveToday = (userId: string, today = todayAsDateInput()) =>
  requests.some((request) => request.userId === userId && request.status === 'approved' && request.startDate <= today && today <= request.endDate);

/*
 * Who decides a request from this person: their reporting manager, or HR when there is no active manager
 * or the manager is on leave today. One decider per request, so a request is never in two queues.
 * Work requests (WFH, time off) follow the same rule.
 */
export type RequestRoute = { to: 'manager'; managerId: string } | { to: 'hr'; why: 'no-manager' | 'manager-away' };

export function approverOf(userId: string): RequestRoute {
  const manager = managerOf(userId);
  if (!manager || !isUserActive(manager)) return { to: 'hr', why: 'no-manager' };
  if (isOnLeaveToday(manager)) return { to: 'hr', why: 'manager-away' };
  return { to: 'manager', managerId: manager };
}

export const isApproverFor = (actor: PermissionUser, userId: string) => {
  if (userId === actor.id) return false;
  const route = approverOf(userId);
  return route.to === 'manager' ? route.managerId === actor.id : actor.role === 'hr';
};

// Plain words for the approval card, e.g. "Sent to HR because Priya Kumar is on leave"
export function describeRoute(userId: string): string {
  const route = approverOf(userId);
  if (route.to === 'manager') return `Decided by ${nameOf(route.managerId)}, their reporting manager`;
  const manager = managerOf(userId);
  return route.why === 'manager-away' && manager ? `Sent to HR because ${nameOf(manager)} is on leave today` : 'Sent to HR because they have no reporting manager';
}

// Who gets told about a new request: the manager, or everyone in HR
export function approverIds(userId: string): string[] {
  const route = approverOf(userId);
  return route.to === 'manager' ? [route.managerId] : getActiveUsers().filter((user) => user.role === 'hr' && user.id !== userId).map((user) => user.id);
}

export const canDecideLeave = (actor: PermissionUser, request: Pick<LeaveRequest, 'userId'>) => isApproverFor(actor, request.userId);

export const leaveService = {
  // GET /api/leave/requests — the caller's own requests
  async list(actor: PermissionUser): Promise<LeaveRequest[]> {
    await delay();
    return requests.filter((request) => request.userId === actor.id);
  },

  // GET /api/leave/requests?scope=approver — pending requests the caller decides, and the ones they decided
  async listForApprover(actor: PermissionUser): Promise<LeaveRequest[]> {
    await delay();
    // Older decisions without a recorded decider fall back to today's routing
    return requests.filter((request) => (request.status === 'pending' || !request.approvedById ? canDecideLeave(actor, request) : request.approvedById === actor.id));
  },

  // POST /api/leave/requests
  async apply(actor: PermissionUser, input: LeaveRequestInput): Promise<LeaveRequest> {
    await delay();
    if (input.endDate < input.startDate) throw new Error('To date cannot be before from date');
    if (!isLeaveTypeAvailable(input.leaveType, getGenderOf(actor.id))) throw new Error(leaveTypeUnavailableReason(input.leaveType));
    const request: LeaveRequest = {
      ...input,
      reason: input.reason.trim(),
      id: generateId(),
      userId: actor.id,
      status: 'pending',
      appliedDate: todayAsDateInput(),
    };
    requests = [request, ...requests];
    notificationService.notify(approverIds(actor.id), actor.id, {
      title: `${nameOf(actor.id)} applied for ${typeLabel(request.leaveType)}`,
      message: `${request.startDate}${request.endDate !== request.startDate ? ` to ${request.endDate}` : ''}: ${request.reason}`,
      type: 'info',
      actionUrl: '/approvals',
    });
    return request;
  },

  // POST /api/leave/requests/:id/decision { decision, comment } — the employee is told either way, with the comment
  async decide(actor: PermissionUser, requestId: string, decision: LeaveDecision, comment = ''): Promise<LeaveRequest> {
    await delay();
    const request = requests.find((entry) => entry.id === requestId);
    if (!request) throw new Error('This leave request no longer exists');
    if (!canDecideLeave(actor, request)) throw new Error("You can't decide on this request");
    if (request.status !== 'pending') throw new Error(`This request was already ${request.status}`);
    const note = comment.trim();
    if (decision === 'rejected' && !note) throw new Error('Add a comment explaining why the request is rejected');
    const decided: LeaveRequest = {
      ...request,
      status: decision,
      approvedBy: nameOf(actor.id),
      approvedById: actor.id,
      approvedDate: todayAsDateInput(),
      decisionComment: note || undefined,
    };
    requests = requests.map((entry) => (entry.id === requestId ? decided : entry));
    notificationService.notify([request.userId], actor.id, {
      title: `Your ${typeLabel(request.leaveType)} was ${decision}`,
      message: `${nameOf(actor.id)} ${decision} your leave from ${request.startDate}${request.endDate !== request.startDate ? ` to ${request.endDate}` : ''}.${note ? ` "${note}"` : ''}`,
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
