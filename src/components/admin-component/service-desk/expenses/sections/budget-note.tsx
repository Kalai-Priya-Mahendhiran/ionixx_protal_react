import { AlertTriangle } from 'lucide-react';
import { formatRupees } from '@/lib/desk-config';
import { budgetState } from '@/lib/desk-reports';

// Budget use with an icon + words for warning and over-budget, never colour alone
export function BudgetNote({ spent, budget }: { spent: number; budget: number }) {
  const state = budgetState(spent, budget);
  if (state === 'over')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
        Over by {formatRupees(spent - budget)}
      </span>
    );
  if (state === 'warning')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        {Math.round((spent / budget) * 100)}% used
      </span>
    );
  return <span className="text-xs text-gray-500">{budget > 0 ? `${formatRupees(budget - spent)} left` : 'No budget set'}</span>;
}
