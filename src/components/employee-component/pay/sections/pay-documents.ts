import {
  amountInWords,
  buildTaxStatement,
  componentYearToDate,
  formatDayMonthYear,
  formatINR,
  formatMonth,
  grossPay,
  incomeTaxDeducted,
  REGIME_RULES,
  takeHomePay,
  totalDeductions,
  type Payslip,
  type PayComponent,
  type TaxDeductions,
} from '@/lib/payroll';
import type { PayProfile } from '@/lib/sample-data/payroll-sample-data';
import { currentPayTheme } from './pay-theme';

/*
 * Printable HTML for payslips, Form 16 and pay letters. Opened in a new window and printed,
 * so the person can save a PDF; values are escaped because names come from the profile.
 */

// The signed-in person plus their pay profile (PAN, bank, joining date…)
export interface PayEmployee extends PayProfile {
  name: string;
  employeeId: string;
  designation: string;
  department: string;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);

const page = (title: string, body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #111827; margin: 28px; font-size: 12.5px; }
  h1 { font-size: 18px; margin: 0; } h2 { font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .04em; color: #4b5563; }
  .muted { color: #6b7280; }
  .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; border-bottom: 3px solid #464EB8; }
  .logo { display: inline-flex; width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg,#4f46e5,#7c3aed); color: #fff; font-weight: 700; align-items: center; justify-content: center; margin-right: 10px; }
  .brand { display: flex; align-items: center; }
  .title { text-align: center; font-size: 15px; font-weight: 600; margin: 16px 0; }
  .top { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
  .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
  dl { display: grid; grid-template-columns: 130px 1fr; gap: 6px 10px; margin: 0; } dt { color: #6b7280; } dd { margin: 0; font-weight: 500; }
  .netbox { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-align: center; display: flex; flex-direction: column; justify-content: center; }
  .netbox .amount { font-size: 26px; font-weight: 700; color: #111827; margin: 4px 0; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; } th, td { padding: 7px 10px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  thead th { background: #f9fafb; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: .03em; border-bottom: 1px solid #e5e7eb; }
  .num { text-align: right; font-variant-numeric: tabular-nums; } tfoot td { font-weight: 700; border-top: 1px solid #e5e7eb; border-bottom: 0; }
  .sum { margin-top: 16px; display: flex; justify-content: space-between; align-items: center; background: #eef2ff; border-radius: 10px; padding: 12px 16px; }
  .sum strong { font-size: 16px; }
  .words { margin-top: 10px; } .foot { margin-top: 28px; text-align: center; font-size: 11px; }
  @media print { body { margin: 12mm; } }
</style></head><body>${body}</body></html>`;

const companyHeader = (title: string, subtitle: string) => `
  <div class="head">
    <div class="brand"><span class="logo">Ix</span><div><h1>Ionixx Technologies Pvt. Ltd.</h1><div class="muted">Chennai, Tamil Nadu, India</div></div></div>
    <div style="text-align:right"><div style="font-weight:600">${escapeHtml(title)}</div><div class="muted">${escapeHtml(subtitle)}</div></div>
  </div>`;

const detailList = (rows: [string, string][]) => `<dl>${rows.map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`).join('')}</dl>`;

const employeeRows = (employee: PayEmployee): [string, string][] => [
  ['Employee name', employee.name],
  ['Employee ID', employee.employeeId],
  ['Designation', employee.designation],
  ['Department', employee.department],
  ['Date of joining', formatDayMonthYear(employee.dateOfJoining)],
  ['Work location', employee.location],
  ['PAN', employee.pan],
  ['UAN (PF)', employee.uan],
  ['Bank account', employee.bankAccount],
];

const componentTable = (title: string, components: PayComponent[], totalLabel: string, total: number, ytd: (name: string) => number) => `
  <div class="box" style="padding:0;overflow:hidden">
    <table>
      <thead><tr><th>${title}</th><th class="num">This month</th><th class="num">Year to date</th></tr></thead>
      <tbody>${components.map((component) => `<tr><td>${escapeHtml(component.name)}</td><td class="num">${formatINR(component.amount)}</td><td class="num muted">${formatINR(ytd(component.name))}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>${totalLabel}</td><td class="num">${formatINR(total)}</td><td></td></tr></tfoot>
    </table>
  </div>`;

// `payslips` is every payslip, for the year-to-date column
export function payslipHtml(payslip: Payslip, payslips: Payslip[], employee: PayEmployee) {
  const net = takeHomePay(payslip);
  // The print window has no CSS variables, so the chosen colour sample is written in directly
  const theme = currentPayTheme();
  const body = `
    ${companyHeader('Salary slip', 'Private and confidential')}
    <div class="title">Payslip for ${formatMonth(payslip.month)}</div>
    <div class="top">
      <div class="box"><h2>Employee details</h2>${detailList(employeeRows(employee))}</div>
      <div class="netbox" style="background:${theme.tint};border-color:${theme.line}">
        <div class="muted">Net pay for ${formatMonth(payslip.month)}</div>
        <div class="amount" style="color:${theme.deep}">${formatINR(net)}</div>
        <div>Paid days: <strong>${payslip.paidDays}</strong> &nbsp;·&nbsp; Loss-of-pay days: <strong>${payslip.workingDays - payslip.paidDays}</strong></div>
        <div class="muted" style="margin-top:4px">Credited on ${formatDayMonthYear(payslip.payDate)}</div>
      </div>
    </div>
    <div class="split">
      ${componentTable('Earnings', payslip.earnings, 'Gross earnings', grossPay(payslip), (name) => componentYearToDate(payslips, payslip, name, 'earnings'))}
      ${componentTable('Deductions', payslip.deductions, 'Total deductions', totalDeductions(payslip), (name) => componentYearToDate(payslips, payslip, name, 'deductions'))}
    </div>
    <div class="sum">
      <span>Gross earnings ${formatINR(grossPay(payslip))} − Total deductions ${formatINR(totalDeductions(payslip))}</span>
      <strong>Net pay ${formatINR(net)}</strong>
    </div>
    <div class="words"><span class="muted">Amount in words:</span> <strong>Rupees ${amountInWords(net)} only</strong></div>
    <div class="foot muted">This payslip is generated by the Ionixx Portal and does not need a signature.</div>`;
  return page(`Payslip – ${formatMonth(payslip.month)}`, body);
}

export function form16Html(payslips: Payslip[], financialYear: string, employee: PayEmployee, deductions?: TaxDeductions) {
  const statement = buildTaxStatement(payslips, financialYear, employee.taxRegime, deductions);
  const { tax } = statement;
  const rows: [string, number][] = [
    ['Gross salary', statement.ytdGross],
    ['Standard deduction u/s 16(ia)', tax.standardDeduction],
    ['Deductions under Chapter VI-A', tax.otherDeductions],
    ['Total taxable income', tax.taxableIncome],
    ['Tax on total income', tax.taxOnIncome],
    ['Rebate u/s 87A', tax.rebate],
    ['Health and education cess (4%)', tax.cess],
    ['Tax payable', tax.totalTax],
    ['Tax deducted at source', statement.taxDeductedYtd],
  ];
  const body = `
    ${companyHeader('Form 16', `Part A & Part B · FY ${financialYear}`)}
    <div class="title">Certificate of tax deducted at source on salary</div>
    <div class="box">${detailList([
      ...employeeRows(employee).slice(0, 4),
      ['PAN', employee.pan],
      ['Tax regime', REGIME_RULES[tax.regime].label],
      ['Assessment year', `${Number(financialYear.split('-')[0]) + 1}-${Number(financialYear.split('-')[1]) + 1}`],
    ])}</div>
    <h2 style="margin-top:18px">Part A – Tax deducted and deposited</h2>
    <div class="box" style="padding:0;overflow:hidden"><table><thead><tr><th>Month</th><th class="num">Gross pay</th><th class="num">TDS</th></tr></thead><tbody>
      ${payslips
        .filter((payslip) => statement.paidMonths.includes(payslip.month))
        .map((payslip) => `<tr><td>${formatMonth(payslip.month)}</td><td class="num">${formatINR(grossPay(payslip))}</td><td class="num">${formatINR(incomeTaxDeducted(payslip))}</td></tr>`)
        .join('')}
    </tbody></table></div>
    <h2 style="margin-top:18px">Part B – Details of salary and tax</h2>
    <div class="box" style="padding:0;overflow:hidden"><table><tbody>${rows.map(([label, amount]) => `<tr><td>${label}</td><td class="num">${formatINR(amount)}</td></tr>`).join('')}</tbody></table></div>`;
  return page(`Form 16 – FY ${financialYear}`, body);
}

export function letterHtml(title: string, issuedOn: string, description: string, employee: PayEmployee) {
  const body = `
    ${companyHeader(title, `Issued on ${issuedOn}`)}
    <div class="box" style="margin-top:16px">${detailList(employeeRows(employee).slice(0, 5))}</div>
    <p style="margin-top:24px">Dear ${escapeHtml(employee.name)},</p>
    <p>${escapeHtml(description)}.</p>
    <p>For any questions, please raise a request with Payroll through the Service Desk.</p>
    <p style="margin-top:32px">Regards,<br>Payroll Team</p>`;
  return page(title, body);
}
