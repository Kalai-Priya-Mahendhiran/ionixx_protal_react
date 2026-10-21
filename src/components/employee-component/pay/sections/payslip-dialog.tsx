import { Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AppDialog, primaryButtonClass } from '@/components/ui/form-dialog';
import {
  amountInWords,
  componentYearToDate,
  financialYearOf,
  formatDayMonthYear,
  formatINR,
  formatMonth,
  grossPay,
  payslipsForYear,
  takeHomePay,
  totalDeductions,
  type PayComponent,
  type Payslip,
} from '@/lib/payroll';
import { payslipHtml, type PayEmployee } from './pay-documents';
import { DEDUCTION_COLOR, TAKE_HOME_COLOR } from './pay-shared';
import { printHtml } from './pay-utils';

export type PayslipView = 'payslip' | 'breakdown';

interface PayslipDialogProps {
  payslip: Payslip | null;
  view: PayslipView;
  // Every payslip, for the year-to-date columns
  payslips: Payslip[];
  employee: PayEmployee;
  onClose: () => void;
}

export function PayslipDialog({ payslip, view, payslips, employee, onClose }: PayslipDialogProps) {
  const print = () => {
    if (payslip && !printHtml(payslipHtml(payslip, payslips, employee))) toast.error('Allow pop-ups for this site to print the payslip');
  };

  return (
    <AppDialog
      open={!!payslip}
      onOpenChange={(open) => !open && onClose()}
      size="2xl"
      className="sm:max-w-4xl"
      title={payslip ? `${view === 'payslip' ? 'Payslip' : 'Pay breakdown'} – ${formatMonth(payslip.month)}` : ''}
      description={view === 'payslip' ? 'Print it, or choose Save as PDF in the print dialog' : 'How your gross pay was split this month'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className={primaryButtonClass} onClick={print}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        </>
      }
    >
      {payslip && (view === 'payslip' ? <PayslipBody payslip={payslip} payslips={payslips} employee={employee} /> : <BreakdownBody payslip={payslip} payslips={payslips} />)}
    </AppDialog>
  );
}

function PayslipBody({ payslip, payslips, employee }: { payslip: Payslip; payslips: Payslip[]; employee: PayEmployee }) {
  const net = takeHomePay(payslip);
  const details: [string, string][] = [
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

  return (
    <div className="space-y-5">
      {/* Company strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#464EB8] pb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 font-bold text-white">Ix</span>
          <div>
            <p className="font-semibold text-gray-900">Ionixx Technologies Pvt. Ltd.</p>
            <p className="text-xs text-gray-500">Chennai, Tamil Nadu, India</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-gray-700">Payslip for {formatMonth(payslip.month)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border border-gray-200 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Employee details</p>
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col justify-center rounded-xl border border-[var(--pay-line)] bg-[var(--pay-tint)] p-4 text-center">
          <p className="text-sm text-[var(--pay-deep)]">Net pay for {formatMonth(payslip.month)}</p>
          <p className="my-1 text-3xl font-bold tabular-nums text-[var(--pay-deep)]">{formatINR(net)}</p>
          <p className="text-sm text-gray-700">
            Paid days <strong>{payslip.paidDays}</strong> · Loss-of-pay days <strong>{payslip.workingDays - payslip.paidDays}</strong>
          </p>
          <p className="mt-1 text-xs text-gray-500">Credited on {formatDayMonthYear(payslip.payDate)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ComponentTable title="Earnings" components={payslip.earnings} totalLabel="Gross earnings" total={grossPay(payslip)} ytd={(name) => componentYearToDate(payslips, payslip, name, 'earnings')} />
        <ComponentTable title="Deductions" components={payslip.deductions} totalLabel="Total deductions" total={totalDeductions(payslip)} ytd={(name) => componentYearToDate(payslips, payslip, name, 'deductions')} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm">
        <span className="text-gray-700">
          Gross earnings {formatINR(grossPay(payslip))} − Total deductions {formatINR(totalDeductions(payslip))}
        </span>
        <span className="text-base font-bold text-gray-900">Net pay {formatINR(net)}</span>
      </div>
      <p className="text-sm text-gray-700">
        <span className="text-gray-500">Amount in words:</span> <strong>Rupees {amountInWords(net)} only</strong>
      </p>
      <p className="text-center text-xs text-gray-400">This payslip is generated by the Ionixx Portal and does not need a signature.</p>
    </div>
  );
}

function ComponentTable({ title, components, totalLabel, total, ytd }: { title: string; components: PayComponent[]; totalLabel: string; total: number; ytd: (name: string) => number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">{title}</th>
            <th className="px-3 py-2 text-right font-semibold">This month</th>
            <th className="px-3 py-2 text-right font-semibold">Year to date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {components.map((component) => (
            <tr key={component.name}>
              <td className="px-3 py-2 text-gray-700">{component.name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatINR(component.amount)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-gray-500">{formatINR(ytd(component.name))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-gray-200 font-semibold">
          <tr>
            <td className="px-3 py-2">{totalLabel}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatINR(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Each component as a share of gross pay, with the year to date
function BreakdownBody({ payslip, payslips }: { payslip: Payslip; payslips: Payslip[] }) {
  const gross = grossPay(payslip);

  const section = (title: string, kind: 'earnings' | 'deductions', color: string) => (
    <>
      <tr className="bg-gray-50">
        <th colSpan={4} scope="colgroup" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
          {title}
        </th>
      </tr>
      {payslip[kind].map((component) => {
        const share = gross > 0 ? (component.amount / gross) * 100 : 0;
        return (
          <tr key={component.name}>
            <td className="px-3 py-2 text-gray-800">{component.name}</td>
            <td className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-full max-w-[120px] rounded-full bg-gray-100">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(share, 100)}%`, backgroundColor: color }} />
                </div>
                <span className="w-10 text-right text-xs tabular-nums text-gray-500">{share.toFixed(0)}%</span>
              </div>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatINR(component.amount)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-gray-600">{formatINR(componentYearToDate(payslips, payslip, component.name, kind))}</td>
          </tr>
        );
      })}
    </>
  );

  // Includes one-off payments from earlier months (bonus etc.) that aren't on this payslip
  const ytdTakeHome = payslipsForYear(payslips, financialYearOf(payslip.month))
    .filter((slip) => slip.month <= payslip.month)
    .reduce((total, slip) => total + takeHomePay(slip), 0);

  return (
    <div className="ionixx-scrollbar overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
            <th className="px-3 py-2 font-medium">Component</th>
            <th className="px-3 py-2 font-medium">Share of gross pay</th>
            <th className="px-3 py-2 text-right font-medium">{formatMonth(payslip.month)}</th>
            <th className="px-3 py-2 text-right font-medium">Year to date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {section('Earnings', 'earnings', TAKE_HOME_COLOR)}
          {section('Deductions', 'deductions', DEDUCTION_COLOR)}
          <tr className="border-t-2 border-gray-200 font-semibold">
            <td className="px-3 py-2" colSpan={2}>
              Take home
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{formatINR(takeHomePay(payslip))}</td>
            <td className="px-3 py-2 text-right tabular-nums">{formatINR(ytdTakeHome)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
