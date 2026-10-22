import { useState } from 'react';
import { LayoutGrid, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { primaryButtonClass } from '@/components/ui/form-dialog';
import { AppSheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { financialYearsOf, formatMonth, grossPay, payslipsForYear, takeHomePay, totalDeductions, type Payslip } from '@/lib/payroll';
import { FinancialYearSelect, MaskedAmount, ShowToggle } from './pay-shared';
import { PayFigures } from './pay-summary-card';
import type { PayslipView } from './payslip-dialog';

type HistoryView = 'grid' | 'table';

interface PayHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslips: Payslip[];
  onView: (payslip: Payslip, view: PayslipView) => void;
}

// "All payslips": every payslip in a financial year, newest first, as cards or a table
export function PayHistorySheet({ open, onOpenChange, payslips, onView }: PayHistorySheetProps) {
  const years = financialYearsOf(payslips);
  const [year, setYear] = useState(years[0] ?? '');
  const [view, setView] = useState<HistoryView>('grid');
  const yearSlips = payslipsForYear(payslips, year).reverse();

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      width="5xl"
      title="All payslips"
      description="Every payslip, by financial year"
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <FinancialYearSelect id="pay-history-year" years={years} value={year} onChange={setYear} className="w-48" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">View</span>
            <div role="radiogroup" aria-label="View" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              {(
                [
                  ['grid', LayoutGrid, 'Cards'],
                  ['table', Rows3, 'Table'],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={view === value}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(value)}
                  className={cn('rounded-md p-1.5', view === value ? 'bg-[#464EB8] text-white' : 'text-gray-500 hover:bg-gray-100')}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {yearSlips.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">No payslips for this financial year.</p>
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {yearSlips.map((payslip) => (
              <PayslipCard key={payslip.month} payslip={payslip} onView={onView} />
            ))}
          </div>
        ) : (
          <PayHistoryTable payslips={yearSlips} onView={onView} />
        )}
      </div>
    </AppSheet>
  );
}

function PayslipCard({ payslip, onView }: { payslip: Payslip; onView: PayHistorySheetProps['onView'] }) {
  const [visible, setVisible] = useState(false);
  return (
    <Card className="shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{formatMonth(payslip.month)}</h3>
          <ShowToggle visible={visible} onToggle={() => setVisible((current) => !current)} label={`${formatMonth(payslip.month)} pay`} />
        </div>
        <PayFigures payslip={payslip} visible={visible} />
        <div className="mt-auto flex flex-col items-center gap-2">
          <Button className={primaryButtonClass} onClick={() => onView(payslip, 'payslip')}>
            Open payslip
          </Button>
          <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={() => onView(payslip, 'breakdown')}>
            See breakdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PayHistoryTable({ payslips, onView }: { payslips: Payslip[]; onView: PayHistorySheetProps['onView'] }) {
  const [visible, setVisible] = useState(false);
  const total = (pick: (payslip: Payslip) => number) => payslips.reduce((sum, payslip) => sum + pick(payslip), 0);
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <ShowToggle visible={visible} onToggle={() => setVisible((current) => !current)} label="pay" />
      </div>
      <div className="app-scrollbar overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-700">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Month</th>
              <th className="px-4 py-2.5 font-semibold">Paid days</th>
              <th className="px-4 py-2.5 text-right font-semibold">Gross pay</th>
              <th className="px-4 py-2.5 text-right font-semibold">Deductions</th>
              <th className="px-4 py-2.5 text-right font-semibold">Take home</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payslips.map((payslip) => (
              <tr key={payslip.month} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-medium text-gray-900">{formatMonth(payslip.month)}</td>
                <td className="px-4 py-2.5 text-gray-600">
                  {payslip.paidDays} / {payslip.workingDays}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <MaskedAmount amount={grossPay(payslip)} visible={visible} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <MaskedAmount amount={totalDeductions(payslip)} visible={visible} />
                </td>
                <td className="px-4 py-2.5 text-right font-medium">
                  <MaskedAmount amount={takeHomePay(payslip)} visible={visible} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-3">
                    <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={() => onView(payslip, 'payslip')}>
                      Payslip
                    </Button>
                    <Button variant="link" className="h-auto p-0 text-[#464EB8]" onClick={() => onView(payslip, 'breakdown')}>
                      Breakdown
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 font-semibold">
            <tr>
              <td className="px-4 py-2.5" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-2.5 text-right">
                <MaskedAmount amount={total(grossPay)} visible={visible} />
              </td>
              <td className="px-4 py-2.5 text-right">
                <MaskedAmount amount={total(totalDeductions)} visible={visible} />
              </td>
              <td className="px-4 py-2.5 text-right">
                <MaskedAmount amount={total(takeHomePay)} visible={visible} />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
