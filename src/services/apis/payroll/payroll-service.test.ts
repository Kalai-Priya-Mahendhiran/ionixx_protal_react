import { ROUTES } from '@/lib/constants';
import { hasModuleAccess } from '@/lib/modules';
import { approvalQueue } from '../approvals/approval-queue';
import { notificationService } from '../notifications/notification-service';
import { payrollService, resetPayroll } from './payroll-service';

const employee = { id: 'EMP001', role: 'employee' as const };
const hr = { id: 'HR001', role: 'hr' as const };
const manager = { id: 'PM001', role: 'project_manager' as const };

describe('payroll claims and declarations', () => {
  beforeEach(() => resetPayroll());

  it("keeps each person's claims separate and starts new people with none", async () => {
    expect((await payrollService.listClaims(employee)).some((claim) => claim.claimNo === 'CLM-260412')).toBe(true);
    expect((await payrollService.listClaims(hr)).some((claim) => claim.claimNo === 'CLM-260412')).toBe(false);
    expect(await payrollService.listClaims({ id: 'EMP999', role: 'employee' })).toEqual([]);
  });

  it("puts a new claim in HR's Approvals queue and tells HR", async () => {
    const claim = await payrollService.submitClaim(employee, { type: 'books', billDate: '2026-10-10', amount: 1200, remarks: 'Reference books' });
    expect(claim).toMatchObject({ status: 'Pending', financialYear: '2026-2027' });
    const queued = (await approvalQueue.list(hr)).find((item) => item.id === `claim:${claim.claimNo}`);
    expect(queued).toMatchObject({ requesterName: 'Kalai Priya', amount: 1200, status: 'pending', kind: 'expense' });
    expect((await notificationService.list(hr)).some((note) => note.title.includes('Kalai Priya claimed Books'))).toBe(true);
    // A reporting manager doesn't review pay
    expect((await approvalQueue.list(manager)).some((item) => item.source === 'payroll')).toBe(false);
  });

  it('caps an approval at what is left of the yearly limit', async () => {
    // Mobile limit is 9000 a year
    const first = await payrollService.submitClaim(employee, { type: 'mobile', billDate: '2026-09-30', amount: 6000, remarks: 'Jul–Sep' });
    const second = await payrollService.submitClaim(employee, { type: 'mobile', billDate: '2026-10-15', amount: 5000, remarks: 'Oct' });
    await approvalQueue.decide(hr, { source: 'payroll', id: `claim:${first.claimNo}` }, 'approved');
    await approvalQueue.decide(hr, { source: 'payroll', id: `claim:${second.claimNo}` }, 'approved');
    const mine = await payrollService.listClaims(employee);
    expect(mine.find((claim) => claim.claimNo === first.claimNo)).toMatchObject({ status: 'Approved', approvedAmount: 6000 });
    expect(mine.find((claim) => claim.claimNo === second.claimNo)).toMatchObject({ status: 'Partially Approved', approvedAmount: 3000 });
    expect((await notificationService.list(employee)).some((note) => note.title.includes(second.claimNo))).toBe(true);
  });

  it('approved proofs count in the declarations; nobody reviews their own', async () => {
    const declaration = await payrollService.submitDeclaration(employee, { type: 'elss', amount: 25000, proofName: 'ELSS statement' });
    await approvalQueue.decide(hr, { source: 'payroll', id: `declaration:${declaration.id}` }, 'approved');
    expect((await payrollService.listDeclarations(employee)).find((entry) => entry.id === declaration.id)).toMatchObject({ status: 'Approved', approvedAmount: 25000 });
    const own = await payrollService.submitClaim(hr, { type: 'books', billDate: '2026-10-10', amount: 500, remarks: 'Books' });
    await expect(payrollService.decideClaim(hr, own.claimNo, 'approved')).rejects.toThrow("can't decide");
  });

  it('opens Approvals for payroll reviewers', () => {
    expect(hasModuleAccess(hr, ROUTES.Approvals)).toBe(true);
    expect(hasModuleAccess({ id: 'EMP002', role: 'employee' }, ROUTES.Approvals)).toBe(false);
  });
});
