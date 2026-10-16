import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, MoreHorizontal, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass } from '@/components/ui/form-fields';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_DESK_SETTINGS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import { budgetState, currentMonthKey, getBudgetReport, monthKey, type BudgetState } from '@/lib/desk-reports';
import { canConfigureDesk } from '@/lib/permissions/desk-permissions';
import { EXPENSE_CATEGORY_VALUES, expenseSchema, type ExpenseFormValues } from '@/lib/schemas';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDate, todayAsDateInput } from '@/lib/utils';
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
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Record an expense'}</DialogTitle>
          <DialogDescription>Office spend counts against the category's monthly budget.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>Date</RequiredLabel>
                    <FormControl>
                      <Input type="date" max={todayAsDateInput()} {...field} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <RequiredLabel>Amount (₹)</RequiredLabel>
                    <FormControl>
                      <Input inputMode="decimal" placeholder="e.g. 4500" {...field} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <SelectField control={form.control} name="category" label="Category" options={EXPENSE_CATEGORY_VALUES.map((value) => ({ value, label: EXPENSE_CATEGORY_LABELS[value] }))} />
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Vendor or payee</RequiredLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Amazon Business" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">What for</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Printer toner ×2" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700">Related request</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Optional, e.g. ADM-103" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Receipt</p>
              {receipt ? <AttachmentList attachments={[receipt]} onRemove={() => setReceipt(undefined)} /> : <AttachmentDropzone compact onUploaded={(uploaded) => setReceipt(uploaded[0])} />}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {pending ? 'Saving…' : expense ? 'Save changes' : 'Record expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BudgetsDialog({ open, budgets, onOpenChange }: { open: boolean; budgets: ExpenseBudgets; onOpenChange: (open: boolean) => void }) {
  const save = useSaveBudgets();
  const [draft, setDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    if (open) setDraft(Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, String(budgets[category])])));
  }, [open, budgets]);
  const invalid = EXPENSE_CATEGORIES.some((category) => !/^\d+$/.test(draft[category] ?? ''));

  return (
    <Dialog open={open} onOpenChange={(next) => !save.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Monthly budgets</DialogTitle>
          <DialogDescription>Per category, in rupees. Categories turn amber at 80% used and red when over.</DialogDescription>
        </DialogHeader>
        <ul className="max-h-[50vh] space-y-2 overflow-y-auto">
          {EXPENSE_CATEGORIES.map((category) => (
            <li key={category} className="grid grid-cols-[minmax(0,1fr)_9rem] items-center gap-3 text-sm">
              <label htmlFor={`budget-${category}`} className="text-gray-800">
                {EXPENSE_CATEGORY_LABELS[category]}
              </label>
              <Input
                id={`budget-${category}`}
                inputMode="numeric"
                value={draft[category] ?? ''}
                onChange={(event) => setDraft({ ...draft, [category]: event.target.value.replace(/[^\d]/g, '') })}
                className={cn(fieldClass, 'h-9 text-right tabular-nums')}
              />
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            disabled={invalid || save.isPending}
            onClick={() => save.mutate(Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, Number(draft[category])])) as ExpenseBudgets, { onSuccess: () => onOpenChange(false) })}
            className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
          >
            {save.isPending ? 'Saving…' : 'Save budgets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const flagged = report.filter((row) => row.state === 'over' || row.state === 'warning');

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Office Expenses</h1>
            <p className="mt-2 text-gray-600">What the office spends, against each category's monthly budget</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Month" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              {months.map((key) => (
                <option key={key} value={key}>
                  {monthName(key)}
                </option>
              ))}
            </select>
            {canConfigureDesk(user) && (
              <Button variant="outline" onClick={() => setBudgetsOpen(true)} className="gap-2">
                <Wallet className="h-4 w-4" />
                Budgets
              </Button>
            )}
            <Button onClick={() => setEditing({ open: true })} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <Plus className="h-4 w-4" />
              Record expense
            </Button>
          </div>
        </div>

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
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <Card>
                <CardContent className="flex h-full flex-col justify-center gap-2 p-5">
                  <p className="text-sm font-medium text-gray-600">Spent in {monthName(month)}</p>
                  <p className="text-4xl font-bold tabular-nums text-gray-900">{formatRupees(spent)}</p>
                  <p className="text-sm text-gray-600">of {formatRupees(budget)} budgeted</p>
                  <BudgetNote spent={spent} budget={budget} />
                  {flagged.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {flagged.length} {flagged.length === 1 ? 'category needs' : 'categories need'} attention
                    </p>
                  )}
                </CardContent>
              </Card>
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
            </div>

            {inMonth.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">Nothing recorded for {monthName(month)}.</div>
            ) : (
              <div className="ionixx-scrollbar relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
