import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppSheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  buildTaxStatement,
  financialYearsOf,
  formatINR,
  formatMonth,
  quarterMonths,
  quarterOf,
  QUARTERS,
  REGIME_RULES,
  type Payslip,
  type Quarter,
  type TaxRegime,
} from '@/lib/payroll';
import { deductionsFromDeclarations, type TaxDeclaration } from '@/lib/sample-data/payroll-sample-data';
import { FinancialYearSelect } from './pay-shared';
import { downloadFile, formatFinancialYear, toCsv } from './pay-utils';

// Quarters named by their months, which read more plainly than Q1–Q4
const QUARTER_LABEL: Record<Quarter, string> = { Q1: 'Apr–Jun', Q2: 'Jul–Sep', Q3: 'Oct–Dec', Q4: 'Jan–Mar' };

interface TaxStatementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslips: Payslip[];
  regime: TaxRegime;
  // Approved proofs reduce the tax under the old regime
  declarations: TaxDeclaration[];
}

// Month-by-month taxable pay for a financial year, its year-end projection and the tax worked out from it
export function TaxStatementSheet({ open, onOpenChange, payslips, regime, declarations }: TaxStatementSheetProps) {
  const deductionsFor = (financialYear: string) => deductionsFromDeclarations(declarations.filter((row) => row.financialYear === financialYear));
  const years = financialYearsOf(payslips);
  const [year, setYear] = useState(years[0] ?? '');
  const statement = buildTaxStatement(payslips, year, regime, deductionsFor(year));
  const latestMonth = statement.paidMonths.at(-1);
  const [quarter, setQuarter] = useState<Quarter>(latestMonth ? quarterOf(latestMonth) : 'Q1');
  const months = quarterMonths(year, quarter);
  const ytdLabel = latestMonth ? `So far (to ${formatMonth(latestMonth)})` : 'So far';
  const regimeCode = regime === 'new' ? 'New' : 'Old';

  const changeYear = (next: string) => {
    setYear(next);
    const last = buildTaxStatement(payslips, next, regime, deductionsFor(next)).paidMonths.at(-1);
    setQuarter(last ? quarterOf(last) : 'Q1');
  };

  const { tax } = statement;
  const summaryRows: [string, number][] = [
    ['Salary for the year', statement.yearEndGross],
    ['Standard deduction', -tax.standardDeduction],
    ['Deductions (Chapter VI-A)', -tax.otherDeductions],
    ['Taxable income', tax.taxableIncome],
    ['Tax on taxable income', tax.taxOnIncome],
    ['Rebate (section 87A)', -tax.rebate],
    ['Health & education cess', tax.cess],
    ['Tax for the year', tax.totalTax],
    ['Tax already deducted', statement.taxDeductedYtd],
    ['Tax still to be deducted', statement.balanceTax],
  ];

  const download = () => {
    const allMonths = statement.paidMonths;
    const rows: (string | number)[][] = [
      ['Component', ...allMonths.map(formatMonth), ytdLabel, 'Full-year estimate'],
      ['Tax regime', ...allMonths.map(() => regimeCode), '', ''],
      ...statement.components.map((name) => [name, ...allMonths.map((month) => statement.amounts[name][month] ?? 0), statement.ytd[name], statement.yearEnd[name]]),
      ...summaryRows.map(([label, amount]) => [label, ...allMonths.map(() => ''), '', amount]),
    ];
    downloadFile(toCsv(rows), `Tax-Statement-FY-${year}.csv`, 'text/csv;charset=utf-8');
  };

  const paid = (month: string) => statement.paidMonths.includes(month);

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      width="5xl"
      title="Tax summary"
      description={`Projected under the ${REGIME_RULES[regime].label.toLowerCase()}`}
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FinancialYearSelect id="tax-statement-year" years={years} value={year} onChange={changeYear} className="w-48" />
          <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={download} disabled={statement.paidMonths.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile label="Taxable income" tag="estimate" amount={tax.taxableIncome} className="text-[#464EB8]" />
          <SummaryTile label="Paid so far" tag="from salary" amount={statement.taxDeductedYtd} className="text-[var(--pay-deep)]" />
          <SummaryTile label="Tax for the year" tag="estimate" amount={tax.totalTax} className="text-[var(--pay-partial-fg)]" />
        </div>

        <div className="rounded-xl p-4 ring-1 ring-inset ring-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Month by month</h3>
          <p className="text-sm text-gray-500">Pick a quarter to see what you were paid each month</p>
          <div role="tablist" aria-label="Quarter" className="my-4 inline-flex rounded-lg bg-gray-100 p-1">
            {QUARTERS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={quarter === value}
                onClick={() => setQuarter(value)}
                className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', quarter === value ? 'bg-white text-[#464EB8] shadow-sm' : 'text-gray-600 hover:text-gray-900')}
              >
                {QUARTER_LABEL[value]}
              </button>
            ))}
          </div>

          {statement.paidMonths.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No pay has been processed for FY {formatFinancialYear(year)} yet.</p>
          ) : (
            <div className="ionixx-scrollbar overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="text-xs text-gray-500">
                  <tr>
                    <th className="border-b border-gray-100 px-3 py-2.5 text-left font-semibold">Component</th>
                    {months.map((month) => (
                      <th key={month} className="border-b border-gray-200 px-3 py-2.5 text-right font-semibold">
                        {formatMonth(month)}
                      </th>
                    ))}
                    <th className="border-b border-gray-100 px-3 py-2.5 text-right font-semibold">{ytdLabel}</th>
                    <th className="border-b border-gray-100 px-3 py-2.5 text-right font-semibold">Full-year estimate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-gray-100 px-3 py-2">Tax regime</td>
                    {months.map((month) => (
                      <td key={month} className="border-b border-gray-100 px-3 py-2 text-right">
                        {paid(month) ? regimeCode : '–'}
                      </td>
                    ))}
                    <td className="border-b border-gray-100" />
                    <td className="border-b border-gray-100" />
                  </tr>
                  {statement.components.map((name) => (
                    <tr key={name}>
                      <td className="border-b border-gray-100 px-3 py-2">{name}</td>
                      {months.map((month) => (
                        <td key={month} className="border-b border-gray-100 px-3 py-2 text-right tabular-nums">
                          {paid(month) ? formatINR(statement.amounts[name][month]) : '–'}
                        </td>
                      ))}
                      <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums">{formatINR(statement.ytd[name])}</td>
                      <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums">{formatINR(statement.yearEnd[name])}</td>
                    </tr>
                  ))}
                  {summaryRows.map(([label, amount]) => (
                    <tr key={label} className={cn(label === 'Taxable income' || label === 'Tax for the year' || label === 'Tax still to be deducted' ? 'bg-indigo-50/60 font-semibold' : '')}>
                      <td className="border-b border-gray-100 px-3 py-2">{label}</td>
                      {months.map((month) => (
                        <td key={month} className="border-b border-gray-100" />
                      ))}
                      <td className="border-b border-gray-100" />
                      <td className="border-b border-gray-100 px-3 py-2 text-right tabular-nums">{formatINR(amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppSheet>
  );
}

function SummaryTile({ label, tag, amount, className }: { label: string; tag: string; amount: number; className: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-inset ring-gray-200">
      <p className="text-sm text-gray-700">
        {label} <span className="text-xs text-gray-500">({tag})</span>
      </p>
      <p className={cn('mt-1 text-2xl font-bold tabular-nums', className)}>{formatINR(amount)}</p>
    </div>
  );
}
