import { useMemo, useState } from 'react';
import { Plus, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass, headerSecondaryButtonClass } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_DESK_SETTINGS, formatRupees } from '@/lib/desk-config';
import { currentMonthKey, getBudgetReport, monthKey } from '@/lib/desk-reports';
import { canConfigureDesk } from '@/lib/permissions/desk-permissions';
import { useDeleteExpense, useDeskSettings, useExpenses } from '@/services/apis/service-desk/use-service-desk';
import type { Expense } from '@/types';
import { BudgetByCategorySection, BudgetsDialog, ExpenseDialog, ExpenseTableSection } from './sections';
import { monthName } from './sections/expenses-meta';

export default function Expenses() {
  const { user } = useAuth();
  const { data: expenses = [], isLoading, isError, refetch } = useExpenses();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const remove = useDeleteExpense();
  const [month, setMonth] = useState(currentMonthKey());
  const [editing, setEditing] = useState<{ open: boolean; expense?: Expense }>({ open: false });
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [budgetsOpen, setBudgetsOpen] = useState(false);

  // Months that have expenses, plus the current one, newest first
  const months = useMemo(() => [...new Set([currentMonthKey(), ...expenses.map((expense) => monthKey(expense.date))])].sort().reverse(), [expenses]);
  const report = getBudgetReport(expenses, settings.budgets, month);
  const spent = report.reduce((sum, row) => sum + row.spent, 0);
  const budget = report.reduce((sum, row) => sum + row.budget, 0);
  const inMonth = expenses.filter((expense) => monthKey(expense.date) === month);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={Receipt}
          title="Office Expenses"
          description="What the office spends, against each category's monthly budget"
          actions={
            <>
              <select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                aria-label="Month"
                className="h-10 rounded-md border border-white/30 bg-white/15 px-3 text-sm text-white [&>option]:text-gray-900"
              >
                {months.map((key) => (
                  <option key={key} value={key}>
                    {monthName(key)}
                  </option>
                ))}
              </select>
              {canConfigureDesk(user) && (
                <Button variant="outline" onClick={() => setBudgetsOpen(true)} className={`gap-2 ${headerSecondaryButtonClass}`}>
                  <Wallet className="h-4 w-4" />
                  Budgets
                </Button>
              )}
              <Button onClick={() => setEditing({ open: true })} className={`gap-2 ${headerPrimaryButtonClass}`}>
                <Plus className="h-4 w-4" />
                Record expense
              </Button>
            </>
          }
        />

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Loading expenses" />
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load expenses.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : (
          <>
            <StatGrid>
              <StatCard icon={Wallet} label={`Spent in ${monthName(month)}`} value={formatRupees(spent)} tone="indigo" hint={`of ${formatRupees(budget)} budget`} />
            </StatGrid>
            <BudgetByCategorySection report={report} />

            {inMonth.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">Nothing recorded for {monthName(month)}.</div>
            ) : (
              <ExpenseTableSection expenses={inMonth} spent={spent} onEdit={(expense) => setEditing({ open: true, expense })} onDelete={setDeleting} />
            )}
          </>
        )}
      </div>

      <ExpenseDialog open={editing.open} expense={editing.expense} onOpenChange={(open) => !open && setEditing((current) => ({ ...current, open: false }))} />
      <BudgetsDialog open={budgetsOpen} budgets={settings.budgets} onOpenChange={setBudgetsOpen} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this expense?"
        description={deleting ? `${formatRupees(deleting.amount)} to ${deleting.vendor} on ${deleting.date}. This can't be undone.` : ''}
        confirmLabel="Delete expense"
        destructive
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </MainLayout>
  );
}
