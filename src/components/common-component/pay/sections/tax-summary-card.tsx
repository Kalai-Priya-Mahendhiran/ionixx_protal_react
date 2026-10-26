import { useState } from 'react';
import { CircleCheck, Hourglass, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { primaryButtonClass } from '@/components/ui/form-dialog';
import { formatMonth, type TaxStatement } from '@/lib/payroll';
import { MaskedAmount, PayCard, ShowToggle } from './pay-shared';

interface TaxSummaryCardProps {
  // The current financial year's statement
  statement: TaxStatement;
  onOpenStatement: () => void;
}

// "Income tax": estimated taxable income for the year, tax paid so far and the year's estimated tax
export function TaxSummaryCard({ statement, onOpenStatement }: TaxSummaryCardProps) {
  const [visible, setVisible] = useState(false);
  const latestMonth = statement.paidMonths.at(-1);

  return (
    <PayCard title="Income tax" icon={Landmark} tone="purple" action={<ShowToggle visible={visible} onToggle={() => setVisible((current) => !current)} label="tax" />}>
      <div>
        <p className="text-sm font-semibold text-gray-800">Estimated taxable income</p>
        <p className="text-xs text-gray-500">For this financial year</p>
        <MaskedAmount amount={statement.tax.taxableIncome} visible={visible} className="text-lg font-semibold text-gray-900" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <CircleCheck className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            Paid so far
          </p>
          {latestMonth && <p className="text-xs text-gray-500">Up to {formatMonth(latestMonth)}</p>}
          <MaskedAmount amount={statement.taxDeductedYtd} visible={visible} className="mt-1 block text-sm font-medium" />
        </div>
        <div className="rounded-lg border border-[var(--pay-line)] bg-[var(--pay-tint)] p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <Hourglass className="h-4 w-4 text-[var(--pay-partial-fg)]" aria-hidden="true" />
            Tax for the year
          </p>
          <p className="text-xs text-gray-500">Estimate</p>
          <MaskedAmount amount={statement.tax.totalTax} visible={visible} className="mt-1 block text-sm font-medium" />
        </div>
      </div>
      <div className="mt-auto flex justify-center">
        <Button className={primaryButtonClass} onClick={onOpenStatement}>
          Tax summary
        </Button>
      </div>
    </PayCard>
  );
}
