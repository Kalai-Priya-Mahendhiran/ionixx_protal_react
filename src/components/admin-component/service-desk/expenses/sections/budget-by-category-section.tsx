import { Card, CardContent } from '@/components/ui/card';
import { EXPENSE_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import type { BudgetRow } from '@/lib/desk-reports';
import { BudgetNote } from './budget-note';
import { BAR_COLOR } from './expenses-meta';

export function BudgetByCategorySection({ report }: { report: BudgetRow[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">By category</h2>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {report
            .filter((row) => row.budget > 0 || row.spent > 0)
            .map((row) => (
              <li key={row.category} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate text-gray-800">{EXPENSE_CATEGORY_LABELS[row.category]}</span>
                  <span className="shrink-0 tabular-nums text-gray-900">
                    {formatRupees(row.spent)} <span className="text-xs text-gray-500">/ {formatRupees(row.budget)}</span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuenow={Math.round((row.share ?? 0) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${EXPENSE_CATEGORY_LABELS[row.category]} budget used`}
                >
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (row.share ?? (row.spent > 0 ? 1 : 0)) * 100)}%`, backgroundColor: BAR_COLOR[row.state] }} />
                </div>
                <BudgetNote spent={row.spent} budget={row.budget} />
              </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
}
