import { MOCK_USERS } from './mock-users';
import { computeIncomeTax, grossPay, incomeTaxDeducted } from './payroll';
import { deductionsFromDeclarations, getPayrollData } from './sample-data/payroll-sample-data';

describe('getPayrollData', () => {
  it('gives every demo login its own pay', () => {
    const grossByUser = MOCK_USERS.map((user) => grossPay(getPayrollData(user.id).payslips.at(-1)!));
    expect(new Set(grossByUser).size).toBe(MOCK_USERS.length);
  });

  it('starts payslips from the joining month', () => {
    const admin = getPayrollData('ADM001');
    expect(admin.payslips[0].month).toBe('2025-08');
    expect(admin.profile.dateOfJoining).toBe('2025-08-01');
  });

  it('deducts no tax when income stays under the rebate limit', () => {
    expect(getPayrollData('ADM001').payslips.every((payslip) => incomeTaxDeducted(payslip) === 0)).toBe(true);
  });

  it('uses approved proofs to lower TDS for old-regime users', () => {
    const hr = getPayrollData('HR001');
    expect(hr.profile.taxRegime).toBe('old');
    const proofs = hr.declarations.filter((row) => row.financialYear === '2026-2027');
    const deductions = deductionsFromDeclarations(proofs);
    // Pending proofs don't count yet
    expect(deductions.nps80CCD1B).toBe(0);
    expect(deductions.section80C).toBe(150000);
    const april = hr.payslips.find((payslip) => payslip.month === '2026-04')!;
    const withoutProofs = Math.round(computeIncomeTax(grossPay(april) * 12, 'old').totalTax / 12);
    expect(incomeTaxDeducted(april)).toBeLessThan(withoutProofs);
  });

  it('falls back to the employee account for unknown ids', () => {
    expect(getPayrollData('nobody')).toBe(getPayrollData('EMP001'));
    expect(getPayrollData(undefined)).toBe(getPayrollData('EMP001'));
  });

  it('only issues Form 16 for a year the person was paid in', () => {
    for (const user of MOCK_USERS) expect(getPayrollData(user.id).form16['2025-2026']).toBe('2026-06-14');
  });
});
