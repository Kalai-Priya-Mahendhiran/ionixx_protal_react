/*
 * Pay & Tax (ESS): payslip totals, Indian financial-year helpers and income tax for the old and new regimes.
 * Pure functions only, so the pay cards, tax statement and tax simulator all compute the same numbers.
 *
 * Months are 'YYYY-MM' strings; a financial year runs April to March and is written '2026-2027'.
 */

export interface PayComponent {
  name: string;
  amount: number;
}

export interface Payslip {
  // 'YYYY-MM'
  month: string;
  payDate: string;
  paidDays: number;
  workingDays: number;
  earnings: PayComponent[];
  deductions: PayComponent[];
}

export type TaxRegime = 'new' | 'old';

const sum = (components: PayComponent[]) => components.reduce((total, component) => total + component.amount, 0);

export const grossPay = (payslip: Payslip) => sum(payslip.earnings);
export const totalDeductions = (payslip: Payslip) => sum(payslip.deductions);
export const takeHomePay = (payslip: Payslip) => grossPay(payslip) - totalDeductions(payslip);
export const incomeTaxDeducted = (payslip: Payslip) => payslip.deductions.find((component) => component.name === INCOME_TAX_COMPONENT)?.amount ?? 0;

export const INCOME_TAX_COMPONENT = 'Income Tax (TDS)';

// ── Formatting ──────────────────────────────────────────────────────────────

const inrFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

// ₹ 1,42,329 / ₹ -14,161
// `|| 0` turns -0 (e.g. a zero rebate shown as a minus) into 0
export const formatINR = (amount: number) => `₹ ${inrFormatter.format(Math.round(amount) || 0)}`;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseMonth = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
};

// 'Oct 2025'
export const formatMonth = (month: string) => {
  const { year, monthIndex } = parseMonth(month);
  return `${MONTH_NAMES[monthIndex]} ${year}`;
};

// "Oct'25"
export const formatShortMonth = (month: string) => {
  const { year, monthIndex } = parseMonth(month);
  return `${MONTH_NAMES[monthIndex]}'${String(year).slice(-2)}`;
};

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const belowHundred = (value: number) => (value < 20 ? ONES[value] : `${TENS[Math.floor(value / 10)]}${value % 10 ? ` ${ONES[value % 10]}` : ''}`);
const belowThousand = (value: number) =>
  [value >= 100 ? `${ONES[Math.floor(value / 100)]} Hundred` : '', belowHundred(value % 100)].filter(Boolean).join(' ');

// Net pay in words on the payslip, Indian grouping: 1,42,329 → "One Lakh Forty Two Thousand Three Hundred Twenty Nine"
export function amountInWords(amount: number): string {
  let value = Math.round(Math.abs(amount));
  if (value === 0) return 'Zero';
  const parts: string[] = [];
  const units: [number, string][] = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
  ];
  for (const [size, label] of units) {
    if (value >= size) {
      parts.push(`${amountInWords(Math.floor(value / size))} ${label}`);
      value %= size;
    }
  }
  if (value > 0) parts.push(belowThousand(value));
  return parts.join(' ');
}

// ── Financial years ─────────────────────────────────────────────────────────

// '2025-10' → '2025-2026'; '2026-02' → '2025-2026'
export const financialYearOf = (month: string) => {
  const { year, monthIndex } = parseMonth(month);
  const start = monthIndex >= 3 ? year : year - 1;
  return `${start}-${start + 1}`;
};

// The twelve months of a financial year, April first
export const financialYearMonths = (financialYear: string): string[] => {
  const start = Number(financialYear.split('-')[0]);
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (3 + index) % 12;
    const year = index < 9 ? start : start + 1;
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  });
};

// Q1 = Apr–Jun … Q4 = Jan–Mar
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
export type Quarter = (typeof QUARTERS)[number];

export const quarterMonths = (financialYear: string, quarter: Quarter) => {
  const index = QUARTERS.indexOf(quarter);
  return financialYearMonths(financialYear).slice(index * 3, index * 3 + 3);
};

export const quarterOf = (month: string): Quarter => {
  const index = financialYearMonths(financialYearOf(month)).indexOf(month);
  return QUARTERS[Math.floor(index / 3)];
};

// Newest financial year first
export const financialYearsOf = (payslips: Payslip[]) => [...new Set(payslips.map((payslip) => financialYearOf(payslip.month)))].sort().reverse();

export const payslipsForYear = (payslips: Payslip[], financialYear: string) =>
  payslips.filter((payslip) => financialYearOf(payslip.month) === financialYear).sort((a, b) => a.month.localeCompare(b.month));

// One earning or deduction added up from April to the payslip's month (the payslip's YTD column)
export const componentYearToDate = (payslips: Payslip[], payslip: Payslip, name: string, kind: 'earnings' | 'deductions') =>
  payslipsForYear(payslips, financialYearOf(payslip.month))
    .filter((slip) => slip.month <= payslip.month)
    .reduce((total, slip) => total + (slip[kind].find((component) => component.name === name)?.amount ?? 0), 0);

// ── Income tax ──────────────────────────────────────────────────────────────

interface Slab {
  upTo: number;
  rate: number;
}

// Section 115BAC (FY 2025-26 onwards)
const NEW_REGIME_SLABS: Slab[] = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const OLD_REGIME_SLABS: Slab[] = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

export const REGIME_RULES: Record<TaxRegime, { label: string; standardDeduction: number; rebateLimit: number; maxRebate: number; slabs: Slab[] }> = {
  new: { label: 'New regime', standardDeduction: 75000, rebateLimit: 1200000, maxRebate: 60000, slabs: NEW_REGIME_SLABS },
  old: { label: 'Old regime', standardDeduction: 50000, rebateLimit: 500000, maxRebate: 12500, slabs: OLD_REGIME_SLABS },
};

export const CESS_RATE = 0.04;

// Old-regime deductions and their caps
export interface TaxDeductions {
  section80C: number;
  section80D: number;
  hraExemption: number;
  homeLoanInterest: number;
  nps80CCD1B: number;
  otherDeductions: number;
}

export const DEDUCTION_LIMITS: Record<keyof TaxDeductions, number> = {
  section80C: 150000,
  section80D: 75000,
  hraExemption: Infinity,
  homeLoanInterest: 200000,
  nps80CCD1B: 50000,
  otherDeductions: Infinity,
};

export const NO_DEDUCTIONS: TaxDeductions = { section80C: 0, section80D: 0, hraExemption: 0, homeLoanInterest: 0, nps80CCD1B: 0, otherDeductions: 0 };

export interface TaxBreakdown {
  regime: TaxRegime;
  grossIncome: number;
  standardDeduction: number;
  // Chapter VI-A and exemptions, after caps (always 0 under the new regime)
  otherDeductions: number;
  taxableIncome: number;
  taxOnIncome: number;
  rebate: number;
  cess: number;
  totalTax: number;
}

const slabTax = (income: number, slabs: Slab[]) => {
  let tax = 0;
  let lower = 0;
  for (const slab of slabs) {
    if (income <= lower) break;
    tax += (Math.min(income, slab.upTo) - lower) * slab.rate;
    lower = slab.upTo;
  }
  return tax;
};

export const cappedDeductions = (deductions: TaxDeductions) =>
  (Object.keys(DEDUCTION_LIMITS) as (keyof TaxDeductions)[]).reduce((total, key) => total + Math.min(Math.max(deductions[key], 0), DEDUCTION_LIMITS[key]), 0);

export function computeIncomeTax(grossIncome: number, regime: TaxRegime, deductions: TaxDeductions = NO_DEDUCTIONS): TaxBreakdown {
  const rules = REGIME_RULES[regime];
  const standardDeduction = Math.min(rules.standardDeduction, Math.max(grossIncome, 0));
  // The new regime doesn't allow 80C, 80D, HRA etc.
  const otherDeductions = regime === 'old' ? cappedDeductions(deductions) : 0;
  const taxableIncome = Math.max(grossIncome - standardDeduction - otherDeductions, 0);
  const taxOnIncome = Math.round(slabTax(taxableIncome, rules.slabs));
  const rebate = taxableIncome <= rules.rebateLimit ? Math.min(taxOnIncome, rules.maxRebate) : 0;
  const cess = Math.round((taxOnIncome - rebate) * CESS_RATE);
  return { regime, grossIncome, standardDeduction, otherDeductions, taxableIncome, taxOnIncome, rebate, cess, totalTax: taxOnIncome - rebate + cess };
}

// ── Tax statement ───────────────────────────────────────────────────────────

export interface TaxStatement {
  financialYear: string;
  // Months with a payslip so far
  paidMonths: string[];
  components: string[];
  // component → month → amount
  amounts: Record<string, Record<string, number>>;
  ytd: Record<string, number>;
  // YTD plus the latest month's pay for each month still to come
  yearEnd: Record<string, number>;
  ytdGross: number;
  yearEndGross: number;
  taxDeductedYtd: number;
  tax: TaxBreakdown;
  // Still to be deducted this year (never negative)
  balanceTax: number;
}

export function buildTaxStatement(payslips: Payslip[], financialYear: string, regime: TaxRegime = 'new', deductions: TaxDeductions = NO_DEDUCTIONS): TaxStatement {
  const slips = payslipsForYear(payslips, financialYear);
  const components = [...new Set(slips.flatMap((payslip) => payslip.earnings.map((component) => component.name)))];
  const amounts: TaxStatement['amounts'] = {};
  for (const name of components) {
    amounts[name] = Object.fromEntries(slips.map((payslip) => [payslip.month, payslip.earnings.find((component) => component.name === name)?.amount ?? 0]));
  }
  const latest = slips.at(-1);
  const remainingMonths = 12 - slips.length;
  const ytd = Object.fromEntries(components.map((name) => [name, Object.values(amounts[name]).reduce((total, amount) => total + amount, 0)]));
  // One-off payments (bonus, leave encashment) aren't projected forward: only what the latest payslip carries
  const yearEnd = Object.fromEntries(
    components.map((name) => [name, ytd[name] + remainingMonths * (latest?.earnings.find((component) => component.name === name)?.amount ?? 0)]),
  );
  const ytdGross = Object.values(ytd).reduce((total, amount) => total + amount, 0);
  const yearEndGross = Object.values(yearEnd).reduce((total, amount) => total + amount, 0);
  const tax = computeIncomeTax(yearEndGross, regime, deductions);
  const taxDeductedYtd = slips.reduce((total, payslip) => total + incomeTaxDeducted(payslip), 0);
  return {
    financialYear,
    paidMonths: slips.map((payslip) => payslip.month),
    components,
    amounts,
    ytd,
    yearEnd,
    ytdGross,
    yearEndGross,
    taxDeductedYtd,
    tax,
    balanceTax: Math.max(tax.totalTax - taxDeductedYtd, 0),
  };
}

// ── Submission windows ──────────────────────────────────────────────────────

export interface SubmissionWindow {
  // 'YYYY-MM-DD', inclusive
  opensOn: string;
  closesOn: string;
}

export const isWindowOpen = (window: SubmissionWindow, today: string) => today >= window.opensOn && today <= window.closesOn;

// '2026-11-01' → '01 Nov 2026'
export const formatDayMonthYear = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day} ${MONTH_NAMES[Number(month) - 1]} ${year}`;
};
