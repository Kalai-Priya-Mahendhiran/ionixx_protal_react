import { isPayrollApprover } from '@/lib/approvers';
import { formatINR, financialYearOf } from '@/lib/payroll';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import {
  CLAIM_TYPES,
  DECLARATION_TYPES,
  PAYROLL_SEEDED_IDS,
  getPayrollData,
  type Claim,
  type ClaimTypeId,
  type DeclarationTypeId,
  type TaxDeclaration,
} from '@/lib/sample-data/payroll-sample-data';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { todayAsDateInput } from '@/lib/utils';
import { notificationService } from '../notifications/notification-service';

/*
 * Reimbursement claims and tax-saving declarations for everyone, shared by the Pay & Tax page
 * (the person's own) and Approvals (HR reviews them). In-memory mock that lasts until refresh.
 * A claim is approved up to what is left of its yearly limit, so a capped claim becomes
 * "Partially Approved" and the approved amount always matches the rules.
 */

export interface ClaimInput {
  type: ClaimTypeId;
  billDate: string;
  amount: number;
  remarks: string;
}

export interface DeclarationInput {
  type: DeclarationTypeId;
  amount: number;
  proofName: string;
}

export type PayrollDecision = 'approved' | 'rejected';

// Claims and declarations with the person they belong to
export type OwnedClaim = Claim & { userId: string };
export type OwnedDeclaration = TaxDeclaration & { userId: string };

const MOCK_LATENCY_MS = 150;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

let claims: OwnedClaim[] = [];
let declarations: OwnedDeclaration[] = [];
let sequence = 0;

export function resetPayroll() {
  claims = PAYROLL_SEEDED_IDS.flatMap((userId) => getPayrollData(userId).claims.map((claim) => ({ ...claim, userId })));
  declarations = PAYROLL_SEEDED_IDS.flatMap((userId) => getPayrollData(userId).declarations.map((declaration) => ({ ...declaration, userId })));
  sequence = 0;
}
resetPayroll();

const nameOf = (userId: string) => getUserById(userId)?.name ?? 'Someone';
export const claimTypeLabel = (type: string) => CLAIM_TYPES.find((entry) => entry.id === type)?.label ?? type;
export const declarationTypeLabel = (type: string) => DECLARATION_TYPES.find((entry) => entry.id === type)?.label ?? type;
const currentYear = () => financialYearOf(todayAsDateInput().slice(0, 7));
const nextId = (prefix: string) => `${prefix}-${todayAsDateInput().slice(2, 4)}${String(Date.now() + ++sequence).slice(-4)}`;
const withoutOwner = <T extends { userId: string }>({ userId: _userId, ...rest }: T) => rest;

// Payroll reviewers hear about every new submission
const tellPayroll = (actor: PermissionUser, title: string, message: string) => {
  const reviewers = getActiveUsers().filter((user) => user.id !== actor.id && isPayrollApprover(user)).map((user) => user.id);
  if (reviewers.length) notificationService.notify(reviewers, actor.id, { title, message, type: 'info', actionUrl: '/approvals' });
};

// What is still claimable this year for a category, after everything already approved
export function remainingLimit(userId: string, type: ClaimTypeId, financialYear: string): number {
  const limit = CLAIM_TYPES.find((entry) => entry.id === type)?.yearlyLimit ?? 0;
  const used = claims.filter((claim) => claim.userId === userId && claim.type === type && claim.financialYear === financialYear).reduce((sum, claim) => sum + claim.approvedAmount, 0);
  return Math.max(0, limit - used);
}

const canDecide = (actor: PermissionUser, ownerId: string) => ownerId !== actor.id && isPayrollApprover(actor);

export const payrollService = {
  // GET /api/payroll/claims — the caller's own claims
  async listClaims(actor: PermissionUser): Promise<Claim[]> {
    await delay();
    return claims.filter((claim) => claim.userId === actor.id).map(withoutOwner);
  },

  // POST /api/payroll/claims
  async submitClaim(actor: PermissionUser, input: ClaimInput): Promise<Claim> {
    await delay();
    const today = todayAsDateInput();
    const claim: OwnedClaim = {
      userId: actor.id,
      claimNo: nextId('CLM'),
      financialYear: financialYearOf(input.billDate.slice(0, 7)),
      type: input.type,
      billDate: input.billDate,
      updatedOn: today,
      amount: input.amount,
      approvedAmount: 0,
      status: 'Pending',
      remarks: input.remarks.trim(),
    };
    claims = [claim, ...claims];
    tellPayroll(actor, `${nameOf(actor.id)} claimed ${claimTypeLabel(claim.type)}`, `${formatINR(claim.amount)} · ${claim.remarks}`);
    return withoutOwner(claim);
  },

  // GET /api/payroll/declarations — the caller's own declarations
  async listDeclarations(actor: PermissionUser): Promise<TaxDeclaration[]> {
    await delay();
    return declarations.filter((declaration) => declaration.userId === actor.id).map(withoutOwner);
  },

  // POST /api/payroll/declarations (or PUT …/:id to resubmit a rejected or partly approved one)
  async submitDeclaration(actor: PermissionUser, input: DeclarationInput, replacesId?: string): Promise<TaxDeclaration> {
    await delay();
    const replaces = replacesId ? declarations.find((entry) => entry.id === replacesId && entry.userId === actor.id) : undefined;
    if (replacesId && !replaces) throw new Error('This declaration no longer exists');
    const declaration: OwnedDeclaration = {
      userId: actor.id,
      id: replaces?.id ?? nextId('INV'),
      financialYear: currentYear(),
      type: input.type,
      declaredAmount: input.amount,
      approvedAmount: 0,
      status: 'Pending',
      submittedOn: todayAsDateInput(),
      remarks: `Proof: ${input.proofName.trim()}`,
    };
    declarations = replaces ? declarations.map((entry) => (entry.id === replaces.id ? declaration : entry)) : [declaration, ...declarations];
    tellPayroll(actor, `${nameOf(actor.id)} ${replaces ? 'resubmitted' : 'declared'} ${declarationTypeLabel(declaration.type)}`, `${formatINR(declaration.declaredAmount)} · ${declaration.remarks}`);
    return withoutOwner(declaration);
  },

  // GET /api/payroll/review — everyone else's claims and declarations, for payroll reviewers
  async listForApprover(actor: PermissionUser): Promise<{ claims: OwnedClaim[]; declarations: OwnedDeclaration[] }> {
    await delay();
    return { claims: claims.filter((claim) => canDecide(actor, claim.userId)), declarations: declarations.filter((declaration) => canDecide(actor, declaration.userId)) };
  },

  // POST /api/payroll/claims/:claimNo/decision
  async decideClaim(actor: PermissionUser, claimNo: string, decision: PayrollDecision, comment = ''): Promise<Claim> {
    await delay();
    const claim = claims.find((entry) => entry.claimNo === claimNo);
    if (!claim) throw new Error('This claim no longer exists');
    if (!canDecide(actor, claim.userId)) throw new Error("You can't decide on this claim");
    if (claim.status !== 'Pending') throw new Error(`This claim was already ${claim.status.toLowerCase()}`);
    const note = comment.trim();
    if (decision === 'rejected' && !note) throw new Error('Add a comment explaining why the claim is rejected');
    const allowed = decision === 'approved' ? Math.min(claim.amount, remainingLimit(claim.userId, claim.type, claim.financialYear)) : 0;
    const status: Claim['status'] = decision === 'rejected' || allowed === 0 ? 'Rejected' : allowed < claim.amount ? 'Partially Approved' : 'Approved';
    const remarks = decision === 'approved' && allowed < claim.amount ? `${claim.remarks} · Limited to the ${formatINR(allowed)} left of this year's limit` : claim.remarks;
    const decided: OwnedClaim = { ...claim, approvedAmount: allowed, status, remarks, updatedOn: todayAsDateInput() };
    claims = claims.map((entry) => (entry.claimNo === claimNo ? decided : entry));
    notificationService.notify([claim.userId], actor.id, {
      title: `Your claim ${claim.claimNo} was ${status.toLowerCase()}`,
      message: `${status === 'Rejected' ? `${claimTypeLabel(claim.type)} · ${formatINR(claim.amount)}` : `${formatINR(allowed)} comes with your next salary`}${note ? ` · "${note}"` : ''}`,
      type: status === 'Rejected' ? 'warning' : 'success',
      actionUrl: '/pay?tab=claims',
    });
    return withoutOwner(decided);
  },

  // POST /api/payroll/declarations/:id/decision
  async decideDeclaration(actor: PermissionUser, id: string, decision: PayrollDecision, comment = ''): Promise<TaxDeclaration> {
    await delay();
    const declaration = declarations.find((entry) => entry.id === id);
    if (!declaration) throw new Error('This declaration no longer exists');
    if (!canDecide(actor, declaration.userId)) throw new Error("You can't decide on this declaration");
    if (declaration.status !== 'Pending') throw new Error(`This declaration was already ${declaration.status.toLowerCase()}`);
    const note = comment.trim();
    if (decision === 'rejected' && !note) throw new Error('Add a comment explaining why the proof is rejected');
    const decided: OwnedDeclaration = { ...declaration, status: decision === 'approved' ? 'Approved' : 'Rejected', approvedAmount: decision === 'approved' ? declaration.declaredAmount : 0 };
    declarations = declarations.map((entry) => (entry.id === id ? decided : entry));
    notificationService.notify([declaration.userId], actor.id, {
      title: `Your ${declarationTypeLabel(declaration.type)} proof was ${decision}`,
      message: `${decision === 'approved' ? `${formatINR(decided.approvedAmount)} now counts towards your tax savings` : 'Please check the proof and resubmit'}${note ? ` · "${note}"` : ''}`,
      type: decision === 'approved' ? 'success' : 'warning',
      actionUrl: '/pay?tab=tax-submission',
    });
    return withoutOwner(decided);
  },
};
