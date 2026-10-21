import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { primaryButtonClass } from '@/components/ui/form-dialog';
import { formatMonth, grossPay, takeHomePay, totalDeductions, type Payslip } from '@/lib/payroll';
import { MaskedAmount, PayCard, PayDonut, ShowToggle } from './pay-shared';

interface PaySummaryCardProps {
  // The latest payslip
  payslip: Payslip | undefined;
  onViewPayslip: (payslip: Payslip) => void;
  onOpenHistory: () => void;
}

// "Salary": the latest month's gross, take home and deductions, hidden until Show amount
export function PaySummaryCard({ payslip, onViewPayslip, onOpenHistory }: PaySummaryCardProps) {
  const [visible, setVisible] = useState(false);

  if (!payslip) {
    return (
      <PayCard title="Salary" icon={Wallet} tone="teal">
        <p className="text-sm text-gray-500">Your salary details appear here after your first payroll.</p>
      </PayCard>
    );
  }

  return (
    <PayCard title="Salary" icon={Wallet} tone="teal" action={<ShowToggle visible={visible} onToggle={() => setVisible((current) => !current)} label="salary" />}>
      <PayFigures payslip={payslip} visible={visible} />
      <div className="mt-auto flex flex-wrap justify-center gap-3">
        <Button className={primaryButtonClass} onClick={() => onViewPayslip(payslip)}>
          Open payslip
        </Button>
        <Button variant="outline" className="border-[#464EB8] text-[#464EB8] hover:bg-indigo-50 hover:text-[#464EB8]" onClick={onOpenHistory}>
          All payslips
        </Button>
      </div>
    </PayCard>
  );
}

// Gross pay on top, then the ring beside take home and deductions (shared with the Pay History cards)
export function PayFigures({ payslip, visible }: { payslip: Payslip; visible: boolean }) {
  return (
    <>
      <div>
        <p className="text-sm font-semibold text-gray-800">
          Gross pay <span className="font-normal text-gray-500">· {formatMonth(payslip.month)}</span>
        </p>
        <MaskedAmount amount={grossPay(payslip)} visible={visible} className="text-lg font-semibold text-gray-900" />
      </div>
      <div className="flex flex-wrap items-center justify-around gap-4">
        <PayDonut payslip={payslip} />
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-gray-800">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--pay-take)]" aria-hidden="true" />
              Take home
            </dt>
            <dd>
              <MaskedAmount amount={takeHomePay(payslip)} visible={visible} />
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 font-semibold text-gray-800">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--pay-ded)]" aria-hidden="true" />
              Deductions
            </dt>
            <dd>
              <MaskedAmount amount={totalDeductions(payslip)} visible={visible} />
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
