import {
  computeIncomeTax,
  financialYearMonths,
  INCOME_TAX_COMPONENT,
  NO_DEDUCTIONS,
  type PayComponent,
  type Payslip,
  type SubmissionWindow,
  type TaxDeductions,
  type TaxRegime,
} from '@/lib/payroll';

/*
 * Pay & Tax sample data. Every demo login (employee, HR, manager, admin, system admin, executive)
 * has its own salary, joining date, tax regime, declarations, claims and letters, so each person
 * sees their own pay. Use getPayrollData(user.id).
 */

// ── Shared catalogues ───────────────────────────────────────────────────────

export const DECLARATION_TYPES = [
  { id: 'ppf', label: 'Public Provident Fund (PPF)', section: '80C' },
  { id: 'elss', label: 'ELSS Mutual Funds', section: '80C' },
  { id: 'life-insurance', label: 'Life Insurance Premium', section: '80C' },
  { id: 'tuition', label: "Children's Tuition Fees", section: '80C' },
  { id: 'health-insurance', label: 'Health Insurance Premium', section: '80D' },
  { id: 'nps', label: 'NPS Contribution', section: '80CCD(1B)' },
  { id: 'rent', label: 'House Rent Paid', section: 'HRA' },
  { id: 'home-loan', label: 'Home Loan Interest', section: '24(b)' },
] as const;

export type DeclarationTypeId = (typeof DECLARATION_TYPES)[number]['id'];

export type ProofStatus = 'Approved' | 'Partially Approved' | 'Rejected' | 'Pending';

export interface TaxDeclaration {
  id: string;
  financialYear: string;
  type: DeclarationTypeId;
  declaredAmount: number;
  approvedAmount: number;
  status: ProofStatus;
  submittedOn: string;
  remarks?: string;
}

// Which tax deduction each kind of declaration counts towards (old regime only)
const DEDUCTION_OF: Record<DeclarationTypeId, keyof TaxDeductions> = {
  ppf: 'section80C',
  elss: 'section80C',
  'life-insurance': 'section80C',
  tuition: 'section80C',
  'health-insurance': 'section80D',
  nps: 'nps80CCD1B',
  rent: 'hraExemption',
  'home-loan': 'homeLoanInterest',
};

// Approved amounts added up by deduction (before the legal caps, which computeIncomeTax applies)
export function deductionsFromDeclarations(declarations: TaxDeclaration[]): TaxDeductions {
  const totals: TaxDeductions = { ...NO_DEDUCTIONS };
  for (const declaration of declarations) totals[DEDUCTION_OF[declaration.type]] += declaration.approvedAmount;
  return totals;
}

export const CLAIM_TYPES = [
  { id: 'fuel', label: 'Fuel & Conveyance', yearlyLimit: 21600 },
  { id: 'internet', label: 'Internet Reimbursement', yearlyLimit: 12000 },
  { id: 'mobile', label: 'Mobile Bill', yearlyLimit: 9000 },
  { id: 'books', label: 'Books & Periodicals', yearlyLimit: 6000 },
  { id: 'medical', label: 'Medical Reimbursement', yearlyLimit: 15000 },
] as const;

export type ClaimTypeId = (typeof CLAIM_TYPES)[number]['id'];

export type ClaimStatus = 'Approved' | 'Partially Approved' | 'Rejected' | 'Pending';
export const CLAIM_STATUSES: ClaimStatus[] = ['Pending', 'Approved', 'Partially Approved', 'Rejected'];

export interface Claim {
  claimNo: string;
  financialYear: string;
  type: ClaimTypeId;
  billDate: string;
  updatedOn: string;
  amount: number;
  approvedAmount: number;
  status: ClaimStatus;
  remarks: string;
}

export interface PayDocument {
  id: string;
  title: string;
  issuedOn: string;
  description: string;
}

// ── Submission windows (company-wide) ───────────────────────────────────────

// Investment declarations for the current year: November
export const TAX_SUBMISSION_WINDOW: SubmissionWindow = { opensOn: '2026-11-01', closesOn: '2026-11-30' };

// Reimbursement claims: second half of October
export const CLAIM_SUBMISSION_WINDOW: SubmissionWindow = { opensOn: '2026-10-15', closesOn: '2026-10-31' };

// Paid up to September 2026 (October is paid on the last working day)
const LATEST_PAID_MONTH = '2026-09';
const PAYROLL_YEARS = ['2025-2026', '2026-2027'];
const WORKING_DAYS = 30;

// ── Per-person pay ──────────────────────────────────────────────────────────

export interface PayProfile {
  pan: string;
  uan: string;
  bankAccount: string;
  location: string;
  // 'YYYY-MM-DD'
  dateOfJoining: string;
  taxRegime: TaxRegime;
}

interface PersonSeed {
  profile: PayProfile;
  // Monthly basic pay in FY 2025-26; the rest of the salary is worked out from it
  basic: number;
  // April 2026 salary revision, e.g. 0.1 = 10%
  revision: number;
  oneOffs?: Record<string, PayComponent[]>;
  lossOfPay?: Record<string, number>;
  declarations?: TaxDeclaration[];
  claims?: Claim[];
  documents?: PayDocument[];
}

const revisionLetter = (percent: number): PayDocument => ({
  id: 'doc-revision-2026',
  title: 'Salary Revision Letter – FY 2026-27',
  issuedOn: '2026-04-03',
  description: `Your salary is revised by ${percent}% with effect from 1 April 2026`,
});

const bonusLetter = (title: string, amount: string): PayDocument => ({
  id: 'doc-bonus-2026',
  title,
  issuedOn: '2026-03-20',
  description: `A bonus of ${amount} is paid with your March 2026 salary`,
});

const PEOPLE: Record<string, PersonSeed> = {
  // Kalai Priya · Software Developer
  EMP001: {
    profile: { pan: 'ABCPK1234F', uan: '101234567890', bankAccount: 'HDFC Bank ••••4821', location: 'Chennai', dateOfJoining: '2022-07-11', taxRegime: 'new' },
    basic: 60000,
    revision: 0.1,
    oneOffs: { '2026-03': [{ name: 'Performance Bonus', amount: 75000 }], '2026-08': [{ name: 'Leave Encashment', amount: 21242 }] },
    lossOfPay: { '2025-06': 1, '2026-07': 2 },
    declarations: [
      { id: 'INV-2601', financialYear: '2026-2027', type: 'ppf', declaredAmount: 60000, approvedAmount: 60000, status: 'Approved', submittedOn: '2026-05-08' },
      { id: 'INV-2602', financialYear: '2026-2027', type: 'life-insurance', declaredAmount: 42000, approvedAmount: 30000, status: 'Partially Approved', submittedOn: '2026-05-08', remarks: 'Premium receipt for the second policy is missing' },
      { id: 'INV-2603', financialYear: '2026-2027', type: 'health-insurance', declaredAmount: 25000, approvedAmount: 25000, status: 'Approved', submittedOn: '2026-05-08' },
      { id: 'INV-2604', financialYear: '2026-2027', type: 'rent', declaredAmount: 216000, approvedAmount: 0, status: 'Rejected', submittedOn: '2026-05-08', remarks: "Landlord's PAN is required for rent above ₹1 lakh a year" },
      { id: 'INV-2501', financialYear: '2025-2026', type: 'ppf', declaredAmount: 50000, approvedAmount: 50000, status: 'Approved', submittedOn: '2025-05-12' },
      { id: 'INV-2502', financialYear: '2025-2026', type: 'elss', declaredAmount: 40000, approvedAmount: 40000, status: 'Approved', submittedOn: '2025-05-12' },
      { id: 'INV-2503', financialYear: '2025-2026', type: 'health-insurance', declaredAmount: 22000, approvedAmount: 22000, status: 'Approved', submittedOn: '2025-05-12' },
    ],
    claims: [
      { claimNo: 'CLM-260412', financialYear: '2026-2027', type: 'internet', billDate: '2026-09-05', updatedOn: '2026-10-17', amount: 2998, approvedAmount: 0, status: 'Pending', remarks: 'Jul–Sep broadband bills' },
      { claimNo: 'CLM-251987', financialYear: '2025-2026', type: 'fuel', billDate: '2025-10-28', updatedOn: '2025-11-06', amount: 5400, approvedAmount: 5400, status: 'Approved', remarks: 'Fuel bills Aug–Oct' },
      { claimNo: 'CLM-251988', financialYear: '2025-2026', type: 'internet', billDate: '2025-10-30', updatedOn: '2025-11-06', amount: 3600, approvedAmount: 3000, status: 'Partially Approved', remarks: 'One bill above the monthly cap of ₹1,000' },
      { claimNo: 'CLM-251990', financialYear: '2025-2026', type: 'books', billDate: '2025-10-20', updatedOn: '2025-11-07', amount: 1850, approvedAmount: 0, status: 'Rejected', remarks: 'Invoice not in the employee’s name' },
      { claimNo: 'CLM-252301', financialYear: '2025-2026', type: 'medical', billDate: '2026-01-14', updatedOn: '2026-01-29', amount: 7200, approvedAmount: 7200, status: 'Approved', remarks: 'Pharmacy bills' },
    ],
    documents: [revisionLetter(10), bonusLetter('Performance Bonus Letter', '₹75,000')],
  },

  // Priya Ramesh · HR Manager (old regime, uses her declarations)
  HR001: {
    profile: { pan: 'BQRPR5521K', uan: '101987650123', bankAccount: 'ICICI Bank ••••1190', location: 'Chennai', dateOfJoining: '2019-03-04', taxRegime: 'old' },
    basic: 55000,
    revision: 0.08,
    oneOffs: { '2026-03': [{ name: 'Performance Bonus', amount: 60000 }] },
    declarations: [
      { id: 'INV-2611', financialYear: '2026-2027', type: 'ppf', declaredAmount: 150000, approvedAmount: 150000, status: 'Approved', submittedOn: '2026-05-04' },
      { id: 'INV-2612', financialYear: '2026-2027', type: 'health-insurance', declaredAmount: 25000, approvedAmount: 25000, status: 'Approved', submittedOn: '2026-05-04' },
      { id: 'INV-2613', financialYear: '2026-2027', type: 'rent', declaredAmount: 240000, approvedAmount: 180000, status: 'Partially Approved', submittedOn: '2026-05-04', remarks: 'Rent receipts for January to March are missing' },
      { id: 'INV-2614', financialYear: '2026-2027', type: 'nps', declaredAmount: 50000, approvedAmount: 0, status: 'Pending', submittedOn: '2026-09-22' },
      { id: 'INV-2511', financialYear: '2025-2026', type: 'ppf', declaredAmount: 150000, approvedAmount: 150000, status: 'Approved', submittedOn: '2025-05-06' },
      { id: 'INV-2512', financialYear: '2025-2026', type: 'rent', declaredAmount: 216000, approvedAmount: 216000, status: 'Approved', submittedOn: '2025-05-06' },
    ],
    claims: [
      { claimNo: 'CLM-260431', financialYear: '2026-2027', type: 'medical', billDate: '2026-08-12', updatedOn: '2026-08-30', amount: 4500, approvedAmount: 4500, status: 'Approved', remarks: 'Clinic and pharmacy bills' },
      { claimNo: 'CLM-260455', financialYear: '2026-2027', type: 'mobile', billDate: '2026-09-30', updatedOn: '2026-10-18', amount: 1500, approvedAmount: 0, status: 'Pending', remarks: 'Jul–Sep mobile bills' },
    ],
    documents: [revisionLetter(8), bonusLetter('Performance Bonus Letter', '₹60,000')],
  },

  // Priya Kumar · Project Manager
  PM001: {
    profile: { pan: 'CKMPK8812L', uan: '100876543210', bankAccount: 'Axis Bank ••••7734', location: 'Bengaluru', dateOfJoining: '2018-01-15', taxRegime: 'new' },
    basic: 90000,
    revision: 0.12,
    oneOffs: { '2026-03': [{ name: 'Performance Bonus', amount: 150000 }] },
    lossOfPay: { '2026-05': 1 },
    declarations: [{ id: 'INV-2621', financialYear: '2026-2027', type: 'health-insurance', declaredAmount: 25000, approvedAmount: 25000, status: 'Approved', submittedOn: '2026-05-10' }],
    claims: [
      { claimNo: 'CLM-260402', financialYear: '2026-2027', type: 'fuel', billDate: '2026-06-30', updatedOn: '2026-07-09', amount: 6000, approvedAmount: 6000, status: 'Approved', remarks: 'Client visits, Apr–Jun' },
      { claimNo: 'CLM-260448', financialYear: '2026-2027', type: 'internet', billDate: '2026-09-30', updatedOn: '2026-10-16', amount: 3000, approvedAmount: 0, status: 'Pending', remarks: 'Jul–Sep broadband bills' },
    ],
    documents: [revisionLetter(12), bonusLetter('Performance Bonus Letter', '₹1,50,000')],
  },

  // Vikram Shah · Administrator (joined August 2025; income below the taxable limit)
  ADM001: {
    profile: { pan: 'DVSPS4410M', uan: '102233445566', bankAccount: 'State Bank of India ••••3305', location: 'Mumbai', dateOfJoining: '2025-08-01', taxRegime: 'new' },
    basic: 25000,
    revision: 0.05,
    claims: [
      { claimNo: 'CLM-260419', financialYear: '2026-2027', type: 'mobile', billDate: '2026-06-30', updatedOn: '2026-07-11', amount: 750, approvedAmount: 750, status: 'Approved', remarks: 'June mobile bill' },
      { claimNo: 'CLM-260437', financialYear: '2026-2027', type: 'fuel', billDate: '2026-08-31', updatedOn: '2026-09-08', amount: 2400, approvedAmount: 0, status: 'Rejected', remarks: 'Fuel bills must be in your own name' },
    ],
    documents: [
      { id: 'doc-appointment', title: 'Appointment Letter', issuedOn: '2025-07-21', description: 'Your appointment as Administrator from 1 August 2025' },
      revisionLetter(5),
    ],
  },

  // kaviya Iyer · System Administrator (old regime with a home loan)
  SYS001: {
    profile: { pan: 'EKIPI2290N', uan: '101112131415', bankAccount: 'Kotak Bank ••••6621', location: 'Hyderabad', dateOfJoining: '2021-05-10', taxRegime: 'old' },
    basic: 70000,
    revision: 0.09,
    oneOffs: { '2025-12': [{ name: 'On-call Allowance', amount: 12000 }] },
    declarations: [
      { id: 'INV-2651', financialYear: '2026-2027', type: 'elss', declaredAmount: 150000, approvedAmount: 150000, status: 'Approved', submittedOn: '2026-05-12' },
      { id: 'INV-2652', financialYear: '2026-2027', type: 'home-loan', declaredAmount: 200000, approvedAmount: 200000, status: 'Approved', submittedOn: '2026-05-12' },
      { id: 'INV-2653', financialYear: '2026-2027', type: 'health-insurance', declaredAmount: 50000, approvedAmount: 25000, status: 'Partially Approved', submittedOn: '2026-05-12', remarks: "Receipt for your parents' policy is missing" },
      { id: 'INV-2654', financialYear: '2026-2027', type: 'nps', declaredAmount: 50000, approvedAmount: 50000, status: 'Approved', submittedOn: '2026-05-12' },
      { id: 'INV-2551', financialYear: '2025-2026', type: 'elss', declaredAmount: 150000, approvedAmount: 150000, status: 'Approved', submittedOn: '2025-05-09' },
      { id: 'INV-2552', financialYear: '2025-2026', type: 'home-loan', declaredAmount: 200000, approvedAmount: 200000, status: 'Approved', submittedOn: '2025-05-09' },
    ],
    claims: [
      { claimNo: 'CLM-260425', financialYear: '2026-2027', type: 'internet', billDate: '2026-06-30', updatedOn: '2026-07-10', amount: 3000, approvedAmount: 3000, status: 'Approved', remarks: 'Apr–Jun broadband bills' },
      { claimNo: 'CLM-260451', financialYear: '2026-2027', type: 'books', billDate: '2026-09-18', updatedOn: '2026-10-17', amount: 2000, approvedAmount: 0, status: 'Pending', remarks: 'Cloud certification guide' },
    ],
    documents: [revisionLetter(9)],
  },

  // Ananya Nair · Chief Executive
  EXE001: {
    profile: { pan: 'FANPN7781P', uan: '100011122233', bankAccount: 'Citibank ••••0042', location: 'Mumbai', dateOfJoining: '2016-06-01', taxRegime: 'new' },
    basic: 250000,
    revision: 0.15,
    oneOffs: { '2026-03': [{ name: 'Annual Bonus', amount: 900000 }] },
    claims: [{ claimNo: 'CLM-260409', financialYear: '2026-2027', type: 'mobile', billDate: '2026-06-30', updatedOn: '2026-07-08', amount: 4500, approvedAmount: 4500, status: 'Approved', remarks: 'Apr–Jun mobile bills' }],
    documents: [revisionLetter(15), bonusLetter('Annual Bonus Letter', '₹9,00,000')],
  },
};

const DEFAULT_PERSON = 'EMP001';

// ── Building payslips ───────────────────────────────────────────────────────

interface SalaryStructure {
  basic: number;
  hra: number;
  special: number;
  lta: number;
  homeOffice: number;
}

const structureFor = (basic: number): SalaryStructure => ({
  basic,
  hra: Math.round(basic * 0.5),
  special: Math.round(basic * 0.58),
  lta: Math.round(basic * 0.083),
  homeOffice: 2500,
});

const monthlyEarnings = (structure: SalaryStructure, factor: number): PayComponent[] => [
  { name: 'Basic Pay', amount: Math.round(structure.basic * factor) },
  { name: 'House Rent Allowance', amount: Math.round(structure.hra * factor) },
  { name: 'Special Allowance', amount: Math.round(structure.special * factor) },
  { name: 'Leave Travel Allowance', amount: Math.round(structure.lta * factor) },
  { name: 'Work From Home Allowance', amount: structure.homeOffice },
];

const sumOf = (components: PayComponent[]) => components.reduce((total, component) => total + component.amount, 0);

function buildPayslips(seed: PersonSeed): Payslip[] {
  const joinedMonth = seed.profile.dateOfJoining.slice(0, 7);
  return PAYROLL_YEARS.flatMap((financialYear, index) => {
    // Rounded to the nearest hundred after the April 2026 revision
    const basic = index === 0 ? seed.basic : Math.round((seed.basic * (1 + seed.revision)) / 100) * 100;
    const structure = structureFor(basic);
    const months = financialYearMonths(financialYear).filter((month) => month >= joinedMonth && month <= LATEST_PAID_MONTH);
    const employedMonths = financialYearMonths(financialYear).filter((month) => month >= joinedMonth);

    // TDS spreads the year's expected tax over the months worked in it
    const expectedIncome = employedMonths.reduce((total, month) => total + sumOf(monthlyEarnings(structure, 1)) + sumOf(seed.oneOffs?.[month] ?? []), 0);
    const yearDeclarations = (seed.declarations ?? []).filter((declaration) => declaration.financialYear === financialYear);
    const tax = computeIncomeTax(expectedIncome, seed.profile.taxRegime, deductionsFromDeclarations(yearDeclarations)).totalTax;
    const tds = employedMonths.length ? Math.round(tax / employedMonths.length) : 0;

    return months.map((month) => {
      const lossOfPay = seed.lossOfPay?.[month] ?? 0;
      const earnings = [...monthlyEarnings(structure, (WORKING_DAYS - lossOfPay) / WORKING_DAYS), ...(seed.oneOffs?.[month] ?? [])];
      const [year, monthNumber] = month.split('-').map(Number);
      const lastDay = new Date(year, monthNumber, 0).getDate();
      return {
        month,
        payDate: `${month}-${String(lastDay).padStart(2, '0')}`,
        paidDays: WORKING_DAYS - lossOfPay,
        workingDays: WORKING_DAYS,
        earnings,
        deductions: [
          { name: 'Provident Fund', amount: Math.round(earnings[0].amount * 0.12) },
          // ₹300 in February, ₹200 otherwise
          { name: 'Professional Tax', amount: month.endsWith('-02') ? 300 : 200 },
          { name: INCOME_TAX_COMPONENT, amount: tds },
        ],
      };
    });
  });
}

export interface PayrollData {
  profile: PayProfile;
  payslips: Payslip[];
  declarations: TaxDeclaration[];
  claims: Claim[];
  documents: PayDocument[];
  // Financial year → date Form 16 was issued (June, after the year closes)
  form16: Record<string, string>;
}

const cache = new Map<string, PayrollData>();

// The signed-in person's pay; unknown ids fall back to the employee demo account
export function getPayrollData(userId: string | undefined): PayrollData {
  const key = userId && PEOPLE[userId] ? userId : DEFAULT_PERSON;
  const cached = cache.get(key);
  if (cached) return cached;
  const seed = PEOPLE[key];
  const payslips = buildPayslips(seed);
  const data: PayrollData = {
    profile: seed.profile,
    payslips,
    declarations: seed.declarations ?? [],
    claims: seed.claims ?? [],
    documents: seed.documents ?? [],
    form16: payslips.some((payslip) => payslip.month < '2026-04') ? { '2025-2026': '2026-06-14' } : {},
  };
  cache.set(key, data);
  return data;
}

// ── Pay & Tax overview content ──────────────────────────────────────────────

export const PAY_TIPS = [
  {
    title: 'A proof sent back to you can be fixed',
    body: 'If Payroll rejects a proof or accepts only part of it, open Tax Declarations while declarations are open and send it again with the missing document.',
  },
  {
    title: 'Not sure which tax regime suits you?',
    body: 'Tax Planner works out your tax under both the old and the new regime from your expected salary, so you can see which one leaves you with more.',
  },
  {
    title: 'Need a payslip for a loan or visa?',
    body: 'Open All payslips, pick the month and use Print / Save PDF. Form 16 for the last year is under Documents every June.',
  },
];

export const HELP_TOPICS = [
  {
    title: 'Declaring an investment',
    steps: ['Go to Tax Declarations while declarations are open.', 'Choose Add investment, enter the amount and name the proof you are attaching.', 'Payroll checks it and the status changes to Approved, Partially Approved or Rejected.'],
  },
  {
    title: 'Comparing tax regimes',
    steps: ['Open Tax Planner; your expected salary for the year is already filled in.', 'Enter what you plan to invest (savings, health insurance, rent, home loan).', 'See the tax under each regime and which one is lower.'],
  },
  {
    title: 'Claiming a reimbursement',
    steps: ['Open Reimbursements while claims are being accepted.', 'Choose New claim, pick the category, and enter the bill date and amount.', 'Follow the approval status in the list; approved amounts come with your salary.'],
  },
];
