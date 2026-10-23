import { LEAVE_TYPES } from '@/lib/constants';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { describeRoute, leaveService } from '../leave/leave-service';
import { claimTypeLabel, declarationTypeLabel, payrollService } from '../payroll/payroll-service';
import { WORK_REQUEST_LABELS, workRequestService } from './work-request-service';

/*
 * One approval queue fed by several request sources (leave, work from home, time off…).
 * Each module registers a source; the Approvals page only knows ApprovalItem, so adding a new
 * kind of request (claims, expenses, overtime) is a new source here, with no change to the page.
 */

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalItem {
  // Unique across sources: `${source}:${id}`
  key: string;
  source: string;
  id: string;
  // Groups the item for icons and colours, e.g. 'leave', 'wfh'
  kind: string;
  typeLabel: string;
  requesterId: string;
  requesterName: string;
  requesterDesignation: string;
  startDate: string;
  endDate: string;
  days?: number;
  // Money requests (claims, proofs) show the amount asked for
  amount?: number;
  reason: string;
  status: ApprovalStatus;
  appliedDate: string;
  decidedBy?: string;
  decidedDate?: string;
  // Why this request is with the viewer, e.g. "Sent to HR because Priya Kumar is on leave today"
  routeNote?: string;
  // The approver's note to the employee
  decisionComment?: string;
}

export interface ApprovalSource {
  id: string;
  list: (actor: PermissionUser) => Promise<ApprovalItem[]>;
  // A comment is required when rejecting, optional when approving; the requester sees it
  decide: (actor: PermissionUser, id: string, decision: ApprovalDecision, comment: string) => Promise<unknown>;
}

const person = (userId: string) => {
  const user = getUserById(userId);
  return { requesterId: userId, requesterName: user?.name ?? 'Unknown', requesterDesignation: user?.designation ?? '' };
};

const leaveSource: ApprovalSource = {
  id: 'leave',
  list: async (actor) =>
    (await leaveService.listForApprover(actor)).map((request) => ({
      key: `leave:${request.id}`,
      source: 'leave',
      id: request.id,
      kind: 'leave',
      typeLabel: LEAVE_TYPES.find((type) => type.id === request.leaveType)?.label ?? 'Leave',
      ...person(request.userId),
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      reason: request.reason,
      status: request.status,
      appliedDate: request.appliedDate,
      decidedBy: request.status === 'pending' ? undefined : request.approvedBy,
      decidedDate: request.status === 'pending' ? undefined : request.approvedDate,
      routeNote: request.status === 'pending' ? describeRoute(request.userId) : undefined,
      decisionComment: request.decisionComment,
    })),
  decide: (actor, id, decision, comment) => leaveService.decide(actor, id, decision, comment),
};

const workRequestSource: ApprovalSource = {
  id: 'work-request',
  list: async (actor) =>
    (await workRequestService.listForApprover(actor)).map((request) => ({
      key: `work-request:${request.id}`,
      source: 'work-request',
      id: request.id,
      kind: request.kind,
      typeLabel: WORK_REQUEST_LABELS[request.kind],
      ...person(request.userId),
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      reason: request.reason,
      status: request.status,
      appliedDate: request.appliedDate,
      decidedBy: request.decidedBy,
      decidedDate: request.decidedDate,
      routeNote: request.status === 'pending' ? describeRoute(request.userId) : undefined,
      decisionComment: request.decisionComment,
    })),
  decide: (actor, id, decision, comment) => workRequestService.decide(actor, id, decision, comment),
};

// Reimbursement claims and tax-saving proofs, reviewed by payroll (HR)
const PAYROLL_STATUS = { Pending: 'pending', Approved: 'approved', 'Partially Approved': 'approved', Rejected: 'rejected' } as const;

const payrollSource: ApprovalSource = {
  id: 'payroll',
  list: async (actor) => {
    const { claims, declarations } = await payrollService.listForApprover(actor);
    return [
      ...claims.map((claim): ApprovalItem => ({
        key: `payroll:claim:${claim.claimNo}`,
        source: 'payroll',
        id: `claim:${claim.claimNo}`,
        kind: 'expense',
        typeLabel: `${claimTypeLabel(claim.type)} claim`,
        ...person(claim.userId),
        startDate: claim.billDate,
        endDate: claim.billDate,
        amount: claim.amount,
        reason: claim.remarks,
        status: PAYROLL_STATUS[claim.status],
        appliedDate: claim.updatedOn,
      })),
      ...declarations.map((declaration): ApprovalItem => ({
        key: `payroll:declaration:${declaration.id}`,
        source: 'payroll',
        id: `declaration:${declaration.id}`,
        kind: 'declaration',
        typeLabel: `${declarationTypeLabel(declaration.type)} proof`,
        ...person(declaration.userId),
        startDate: declaration.submittedOn,
        endDate: declaration.submittedOn,
        amount: declaration.declaredAmount,
        reason: declaration.remarks ?? '',
        status: PAYROLL_STATUS[declaration.status],
        appliedDate: declaration.submittedOn,
      })),
    ];
  },
  decide: (actor, id, decision, comment) => {
    const [kind, ref] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
    return kind === 'claim' ? payrollService.decideClaim(actor, ref, decision, comment) : payrollService.decideDeclaration(actor, ref, decision, comment);
  },
};

const sources: ApprovalSource[] = [leaveSource, workRequestSource, payrollSource];

// For modules that add their own approvable requests (call once at module load)
export function registerApprovalSource(source: ApprovalSource) {
  if (!sources.some((entry) => entry.id === source.id)) sources.push(source);
}

export const approvalQueue = {
  // Everything the caller can decide, newest application first
  async list(actor: PermissionUser): Promise<ApprovalItem[]> {
    const lists = await Promise.all(sources.map((source) => source.list(actor)));
    return lists.flat().sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  },

  async decide(actor: PermissionUser, item: Pick<ApprovalItem, 'source' | 'id'>, decision: ApprovalDecision, comment = ''): Promise<void> {
    const source = sources.find((entry) => entry.id === item.source);
    if (!source) throw new Error('This kind of request can no longer be decided here');
    await source.decide(actor, item.id, decision, comment);
  },
};
