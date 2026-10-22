import type { PermissionUser } from '@/lib/permissions/task-permissions';

/*
 * Who reviews requests that don't go to a reporting manager. Kept in one place so the
 * services that check it and the page access rules (lib/modules) always agree.
 */

// Reimbursement claims and tax-saving proofs are checked by HR (payroll)
export const isPayrollApprover = (user: Pick<PermissionUser, 'role'>) => user.role === 'hr';
