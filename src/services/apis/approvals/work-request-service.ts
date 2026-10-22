import { managerOf } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { approvalRequests } from '@/lib/team-data';
import { getUserById } from '@/lib/user-directory';
import { todayAsDateInput } from '@/lib/utils';
import { notificationService } from '../notifications/notification-service';

/*
 * Work-from-home and time-off requests (not leave: no balance is used). In-memory mock.
 * Like leave, a request goes to the person's reporting manager; HR can act on any.
 */

export type WorkRequestKind = 'wfh' | 'time-off';
export type WorkRequestStatus = 'pending' | 'approved' | 'rejected';

export interface WorkRequest {
  id: string;
  userId: string;
  kind: WorkRequestKind;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: WorkRequestStatus;
  appliedDate: string;
  decidedBy?: string;
  decidedDate?: string;
}

export const WORK_REQUEST_LABELS: Record<WorkRequestKind, string> = { wfh: 'Work from home', 'time-off': 'Time off' };

const MOCK_LATENCY_MS = 150;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// Seeded from the old Approvals sample (its leave items now live in the leave service)
let requests: WorkRequest[] = approvalRequests
  .filter((request): request is typeof request & { type: WorkRequestKind } => request.type === 'wfh' || request.type === 'time-off')
  .map((request) => ({
    id: request.id,
    userId: request.employeeId,
    kind: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    reason: request.reason,
    status: request.status,
    appliedDate: request.appliedDate,
    decidedBy: request.decidedBy,
    decidedDate: request.decidedDate,
  }));

let nextNumber = 2001;
const nameOf = (userId: string) => getUserById(userId)?.name ?? 'Someone';

// People approved to work from home on a date (read by attendance)
export const approvedWfhOn = (date: string): string[] =>
  requests.filter((request) => request.kind === 'wfh' && request.status === 'approved' && request.startDate <= date && date <= request.endDate).map((request) => request.userId);

export const canDecideWorkRequest =(actor: PermissionUser, request: Pick<WorkRequest, 'userId'>) =>
  request.userId !== actor.id && (managerOf(request.userId) === actor.id || actor.role === 'hr');

export const workRequestService = {
  // GET /api/work-requests — the caller's own
  async list(actor: PermissionUser): Promise<WorkRequest[]> {
    await delay();
    return requests.filter((request) => request.userId === actor.id);
  },

  // GET /api/work-requests?scope=approver
  async listForApprover(actor: PermissionUser): Promise<WorkRequest[]> {
    await delay();
    return requests.filter((request) => canDecideWorkRequest(actor, request));
  },

  // POST /api/work-requests
  async apply(actor: PermissionUser, input: Pick<WorkRequest, 'kind' | 'startDate' | 'endDate' | 'days' | 'reason'>): Promise<WorkRequest> {
    await delay();
    const request: WorkRequest = { ...input, reason: input.reason.trim(), id: `REQ-${nextNumber++}`, userId: actor.id, status: 'pending', appliedDate: todayAsDateInput() };
    requests = [request, ...requests];
    const manager = managerOf(actor.id);
    if (manager) {
      notificationService.notify([manager], actor.id, { title: `${nameOf(actor.id)} asked for ${WORK_REQUEST_LABELS[request.kind].toLowerCase()}`, message: request.reason, type: 'info', actionUrl: '/approvals' });
    }
    return request;
  },

  // POST /api/work-requests/:id/decision
  async decide(actor: PermissionUser, requestId: string, decision: 'approved' | 'rejected'): Promise<WorkRequest> {
    await delay();
    const request = requests.find((entry) => entry.id === requestId);
    if (!request) throw new Error('This request no longer exists');
    if (!canDecideWorkRequest(actor, request)) throw new Error("You can't decide on this request");
    if (request.status !== 'pending') throw new Error(`This request was already ${request.status}`);
    const decided: WorkRequest = { ...request, status: decision, decidedBy: nameOf(actor.id), decidedDate: todayAsDateInput() };
    requests = requests.map((entry) => (entry.id === requestId ? decided : entry));
    notificationService.notify([request.userId], actor.id, {
      title: `Your ${WORK_REQUEST_LABELS[request.kind].toLowerCase()} request was ${decision}`,
      message: `${nameOf(actor.id)} ${decision} your request for ${request.startDate}.`,
      type: decision === 'approved' ? 'success' : 'warning',
    });
    return decided;
  },
};
