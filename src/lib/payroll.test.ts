import {
  amountInWords,
  buildTaxStatement,
  computeIncomeTax,
  financialYearMonths,
  financialYearOf,
  formatINR,
  formatShortMonth,
  isWindowOpen,
  NO_DEDUCTIONS,
  quarterMonths,
  quarterOf,
  takeHomePay,
  type Payslip,
} from './payroll';

const payslip = (month: string, basic: number, tds: number, extra: Payslip['earnings'] = []): Payslip => ({
  month,
  payDate: `${month}-30`,
  paidDays: 30,
  workingDays: 30,
  earnings: [{ name: 'Basic Pay', amount: basic }, ...extra],
  deductions: [{ name: 'Income Tax (TDS)', amount: tds }],
});

describe('financial years', () => {
  it('puts January to March in the previous financial year', () => {
    expect(financialYearOf('2026-02')).toBe('2025-2026');
    expect(financialYearOf('2026-04')).toBe('2026-2027');
  });

  it('lists April to March', () => {
    const months = financialYearMonths('2026-2027');
    expect(months).toHaveLength(12);
    expect(months[0]).toBe('2026-04');
    expect(months[11]).toBe('2027-03');
  });

  it('splits the year into quarters from April', () => {
    expect(quarterMonths('2026-2027', 'Q4')).toEqual(['2027-01', '2027-02', '2027-03']);
    expect(quarterOf('2026-08')).toBe('Q2');
    expect(quarterOf('2027-01')).toBe('Q4');
  });
});

describe('formatting', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(142329)).toBe('₹ 1,42,329');
    expect(formatShortMonth('2025-10')).toBe("Oct'25");
    expect(formatINR(-0)).toBe('₹ 0');
  });

  it('writes amounts in words with lakhs and crores', () => {
    expect(amountInWords(142329)).toBe('One Lakh Forty Two Thousand Three Hundred Twenty Nine');
    expect(amountInWords(20000000)).toBe('Two Crore');
    expect(amountInWords(0)).toBe('Zero');
  });
});

describe('computeIncomeTax', () => {
  it('applies the new regime slabs, standard deduction and cess', () => {
    // Taxable 15,15,000: 20,000 + 40,000 + 47,250 = 1,07,250, cess 4,290
    const result = computeIncomeTax(1590000, 'new');
    expect(result.taxableIncome).toBe(1515000);
    expect(result.taxOnIncome).toBe(107250);
    expect(result.cess).toBe(4290);
    expect(result.totalTax).toBe(111540);
  });

  it('gives the full 87A rebate up to ₹12 lakh taxable under the new regime', () => {
    expect(computeIncomeTax(1275000, 'new').totalTax).toBe(0);
  });

  it('ignores deductions under the new regime', () => {
    expect(computeIncomeTax(1590000, 'new', { ...NO_DEDUCTIONS, section80C: 150000 }).totalTax).toBe(111540);
  });

  it('caps old-regime deductions at their limits', () => {
    // 80C capped at 1,50,000: taxable 10,00,000 − 50,000 − 1,75,000 = 7,75,000 → 67,500 + 2,700 cess
    const result = computeIncomeTax(1000000, 'old', { ...NO_DEDUCTIONS, section80C: 200000, section80D: 25000 });
    expect(result.otherDeductions).toBe(175000);
    expect(result.taxableIncome).toBe(775000);
    expect(result.totalTax).toBe(70200);
  });
});

describe('buildTaxStatement', () => {
  const slips = [payslip('2026-04', 100000, 5000, [{ name: 'Bonus', amount: 50000 }]), payslip('2026-05', 100000, 5000), payslip('2025-12', 90000, 4000)];

  it('totals the year to date and projects the latest month to year end', () => {
    const statement = buildTaxStatement(slips, '2026-2027');
    expect(statement.paidMonths).toEqual(['2026-04', '2026-05']);
    expect(statement.ytd['Basic Pay']).toBe(200000);
    // 2 paid + 10 more at the May amount
    expect(statement.yearEnd['Basic Pay']).toBe(1200000);
    // A one-off isn't projected forward
    expect(statement.yearEnd.Bonus).toBe(50000);
    expect(statement.yearEndGross).toBe(1250000);
    expect(statement.taxDeductedYtd).toBe(10000);
  });

  it('never shows a negative balance when more tax was deducted than due', () => {
    expect(buildTaxStatement(slips, '2026-2027').balanceTax).toBe(0);
  });
});

it('take home is gross minus deductions', () => {
  expect(takeHomePay(payslip('2026-04', 100000, 5000))).toBe(95000);
});

it('submission windows include both end dates', () => {
  const period = { opensOn: '2026-11-01', closesOn: '2026-11-30' };
  expect(isWindowOpen(period, '2026-10-31')).toBe(false);
  expect(isWindowOpen(period, '2026-11-01')).toBe(true);
  expect(isWindowOpen(period, '2026-11-30')).toBe(true);
});
