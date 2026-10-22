import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, MoreHorizontal, Pencil, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass, headerSecondaryButtonClass } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormDialog } from '@/components/ui/form-dialog';
import { SelectField, TextField } from '@/components/ui/form-fields';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_DESK_SETTINGS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import { budgetState, currentMonthKey, getBudgetReport, monthKey, type BudgetState } from '@/lib/desk-reports';
import { budgetsSchema, type BudgetsFormValues } from '@/lib/form-schemas/desk';
import { canConfigureDesk } from '@/lib/permissions/desk-permissions';
import { EXPENSE_CATEGORY_VALUES, expenseSchema, type ExpenseFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import { formatDate, todayAsDateInput } from '@/lib/utils';
import { useCreateExpense, useDeleteExpense, useDeskSettings, useExpenses, useSaveBudgets, useUpdateExpense } from '@/services/apis/service-desk/use-service-desk';
import type { Expense, ExpenseBudgets, TaskAttachment } from '@/types';
import { AttachmentDropzone, AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';
import { requestPath } from './desk-links';

const BAR_COLOR: Record<BudgetState, string> = { ok: '#2a78d6', none: '#2a78d6', warning: '#fab219', over: '#d03b3b' };

const monthName = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Budget use with an icon + words for warning and over-budget, never colour alone
function BudgetNote({ spent, budget }: { spent: number; budget: number }) {
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

const emptyValues = (): ExpenseFormValues => ({ date: todayAsDateInput(), category: 'supplies', vendor: '', amount: '', description: '', requestKey: '' });

function ExpenseDialog({ open, expense, onOpenChange }: { open: boolean; expense?: Expense; onOpenChange: (open: boolean) => void }) {
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const [receipt, setReceipt] = useState<TaskAttachment | undefined>();
  const form = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues: emptyValues() });
  const pending = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    form.reset(
      expense
        ? { date: expense.date, category: expense.category, vendor: expense.vendor, amount: String(expense.amount), description: expense.description ?? '', requestKey: expense.requestKey ?? '' }
        : emptyValues(),
    );
    setReceipt(expense?.receipt);
  }, [open, expense, form]);

  const onSubmit = (values: ExpenseFormValues) => {
    const input = { ...values, amount: Number(values.amount.replace(/,/g, '')), receipt };
    const close = { onSuccess: () => onOpenChange(false) };
    if (expense) update.mutate({ id: expense.id, input }, close);
    else create.mutate(input, close);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={expense ? 'Edit expense' : 'Record an expense'}
      description="Office spend counts against the category's monthly budget."
      size="lg"
      submitLabel={expense ? 'Save changes' : 'Record expense'}
      pending={pending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="date" label="Date" type="date" max={todayAsDateInput()} required />
        <TextField control={form.control} name="amount" label="Amount (₹)" inputMode="decimal" placeholder="e.g. 4500" required />
      </div>
      <SelectField control={form.control} name="category" label="Category" options={EXPENSE_CATEGORY_VALUES.map((value) => ({ value, label: EXPENSE_CATEGORY_LABELS[value] }))} />
      <TextField control={form.control} name="vendor" label="Vendor or payee" placeholder="e.g. Amazon Business" required />
      <TextField control={form.control} name="description" label="What for" placeholder="e.g. Printer toner ×2" />
      <TextField control={form.control} name="requestKey" label="Related request" placeholder="Optional, e.g. ADM-103" />
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Receipt</p>
        {receipt ? <AttachmentList attachments={[receipt]} onRemove={() => setReceipt(undefined)} /> : <AttachmentDropzone compact onUploaded={(uploaded) => setReceipt(uploaded[0])} />}
      </div>
    </FormDialog>
  );
}

const toBudgetValues = (budgets: ExpenseBudgets) => Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, String(budgets[category])])) as BudgetsFormValues;

function BudgetsDialog({ open, budgets, onOpenChange }: { open: boolean; budgets: ExpenseBudgets; onOpenChange: (open: boolean) => void }) {
  const save = useSaveBudgets();
  const form = useForm<BudgetsFormValues>({ resolver: zodResolver(budgetsSchema), defaultValues: toBudgetValues(budgets) });
  useEffect(() => {
    if (open) form.reset(toBudgetValues(budgets));
  }, [open, budgets, form]);

  const onSubmit = (values: BudgetsFormValues) =>
    save.mutate(Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, Number(values[category])])) as ExpenseBudgets, { onSuccess: () => onOpenChange(false) });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Monthly budgets"
      description="Per category, in rupees. Categories turn amber at 80% used and red when over."
      submitLabel="Save budgets"
      pending={save.isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {EXPENSE_CATEGORIES.map((category) => (
          <TextField key={category} control={form.control} name={category} label={EXPENSE_CATEGORY_LABELS[category]} inputMode="numeric" placeholder="e.g. 30000" required />
        ))}
      </div>
    </FormDialog>
  );
}

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

            {inMonth.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">Nothing recorded for {monthName(month)}.</div>
            ) : (
              <div className="app-scrollbar relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Request</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Recorded by</th>
                      <th className="w-12 px-3 py-2">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inMonth.map((expense) => (
                      <tr key={expense.id} className="hover:bg-indigo-50/40">
                        <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">{formatDate(`${expense.date}T00:00:00`)}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900">{expense.vendor}</p>
                          {expense.description && <p className="text-xs text-gray-500">{expense.description}</p>}
                          {expense.receipt && <p className="text-xs text-indigo-700">Receipt: {expense.receipt.name}</p>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">{EXPENSE_CATEGORY_LABELS[expense.category]}</td>
                        <td className="px-3 py-2.5">
                          {expense.requestKey ? (
                            <Link to={requestPath(expense.requestKey)} className="font-medium text-[#464EB8] hover:underline">
                              {expense.requestKey}
                            </Link>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900">{formatRupees(expense.amount)}</td>
                        <td className="px-3 py-2.5 text-gray-700">{getUserById(expense.recordedById)?.name ?? '—'}</td>
                        <td className="px-3 py-2.5 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${expense.vendor} on ${expense.date}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuItem onSelect={() => setEditing({ open: true, expense })}>
                                <Pencil className="text-gray-500" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setDeleting(expense)} className="text-red-600">
                                <Trash2 />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 text-sm font-semibold">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-gray-700">
                        {inMonth.length} {inMonth.length === 1 ? 'expense' : 'expenses'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatRupees(spent)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
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
