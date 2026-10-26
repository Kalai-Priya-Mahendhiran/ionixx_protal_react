import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { formatRupees } from '@/lib/desk-config';
import type { MonthSpend } from '@/lib/desk-reports';
import { ChartCard, ColumnChart } from '@/components/employee-component/tasks/sections/charts';

export function OfficeSpendSection({ spend }: { spend: MonthSpend[] }) {
  return (
    <ChartCard
      title="Office spend"
      subtitle={
        <>
          ₹ thousands per month, against a {formatRupees(spend[0]?.budget ?? 0)} monthly budget ·{' '}
          <Link to={ROUTES.Expenses} className="font-medium text-[#464EB8] hover:underline">
            See expenses
          </Link>
        </>
      }
      table={{ columns: ['Month', 'Spent', 'Budget'], rows: spend.map((month) => [month.label, formatRupees(month.spent), formatRupees(month.budget)]) }}
    >
      <ColumnChart
        data={spend.map((month) => ({ label: month.label, value: Math.round(month.spent / 1000) }))}
        ariaLabel="Office spend per month in thousands of rupees"
        valueName="Spent (₹ thousand)"
      />
    </ChartCard>
  );
}
