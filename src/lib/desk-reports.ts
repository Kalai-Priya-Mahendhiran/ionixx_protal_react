import { BUDGET_WARNING_SHARE, EXPENSE_CATEGORIES, REQUEST_CATEGORIES } from '@/lib/desk-config';
import { getSlaStatus } from '@/lib/sla';
import type { AdminRequest, Expense, ExpenseBudgets, ExpenseCategory, RequestCategory, SlaTargets } from '@/types';

/*
 * Numbers for Desk Reports and the Expenses page. Pure functions so they're easy to test.
 * With the backend these come from GET /api/service-desk/reports and GET /api/expenses/summary.
 */

const isDone = (request: AdminRequest) => request.status === 'resolved' || request.status === 'closed';
const average = (values: number[]) => (values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length);
export const monthKey = (iso: string) => iso.slice(0, 7); // YYYY-MM

// Requests raised within the last `days` days (all of them when days is undefined)
export function inPeriod(requests: AdminRequest[], days: number | undefined, now: Date = new Date()): AdminRequest[] {
  if (!days) return requests;
  const since = now.getTime() - days * 24 * 60 * 60 * 1000;
  return requests.filter((request) => new Date(request.createdAt).getTime() >= since);
}

export interface DeskSummary {
  total: number;
  open: number;
  breachedOpen: number;
  resolved: number;
  avgResolutionMs: number | null;
  slaMetRate: number | null; // share of finished requests that met both targets, 0..1
}

export function summarizeDesk(requests: AdminRequest[], sla: SlaTargets, now: Date = new Date()): DeskSummary {
  const open = requests.filter((request) => !isDone(request));
  const done = requests.filter(isDone);
  const status = (request: AdminRequest) => getSlaStatus(request, sla[request.category], now);
  return {
    total: requests.length,
    open: open.length,
    breachedOpen: open.filter((request) => status(request).breached).length,
    resolved: done.length,
    avgResolutionMs: average(done.map((request) => status(request).resolution.elapsedMs)),
    slaMetRate: done.length === 0 ? null : done.filter((request) => !status(request).breached).length / done.length,
  };
}

export interface CategoryReport {
  category: RequestCategory;
  total: number;
  open: number;
  avgResponseMs: number | null;
  avgResolutionMs: number | null;
  breaches: number;
}

export function getCategoryReport(requests: AdminRequest[], sla: SlaTargets, now: Date = new Date()): CategoryReport[] {
  return REQUEST_CATEGORIES.map((category) => {
    const rows = requests.filter((request) => request.category === category);
    const statuses = rows.map((request) => ({ request, sla: getSlaStatus(request, sla[category], now) }));
    return {
      category,
      total: rows.length,
      open: rows.filter((request) => !isDone(request)).length,
      avgResponseMs: average(statuses.filter(({ request }) => request.firstResponseAt).map(({ sla: status }) => status.response.elapsedMs)),
      avgResolutionMs: average(statuses.filter(({ request }) => request.resolvedAt).map(({ sla: status }) => status.resolution.elapsedMs)),
      breaches: statuses.filter(({ sla: status }) => status.breached).length,
    };
  });
}

// Requests that missed (or are missing) a target, worst first
export function getBreachedRequests(requests: AdminRequest[], sla: SlaTargets, now: Date = new Date()): { request: AdminRequest; overByMs: number; kind: 'response' | 'resolution' }[] {
  return requests
    .map((request) => {
      const status = getSlaStatus(request, sla[request.category], now);
      const kind = status.resolution.state === 'breached' ? ('resolution' as const) : ('response' as const);
      return status.breached ? { request, kind, overByMs: -(kind === 'resolution' ? status.resolution.remainingMs : status.response.remainingMs) } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => Number(isDone(a.request)) - Number(isDone(b.request)) || b.overByMs - a.overByMs);
}

export interface MonthTrend {
  month: string; // YYYY-MM
  label: string; // e.g. "Oct"
  raised: number;
  resolved: number;
}

const monthLabel = (date: Date) => date.toLocaleDateString('en-US', { month: 'short' });

// The last `months` months, oldest first
function lastMonths(months: number, now: Date): Date[] {
  return Array.from({ length: months }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1));
}
const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export function getMonthlyTrend(requests: AdminRequest[], months = 3, now: Date = new Date()): MonthTrend[] {
  return lastMonths(months, now).map((start) => {
    const key = toMonthKey(start);
    return {
      month: key,
      label: monthLabel(start),
      raised: requests.filter((request) => monthKey(request.createdAt) === key).length,
      resolved: requests.filter((request) => request.resolvedAt && monthKey(request.resolvedAt) === key).length,
    };
  });
}

/* ---------- Expenses ---------- */

export type BudgetState = 'ok' | 'warning' | 'over' | 'none';

export interface BudgetRow {
  category: ExpenseCategory;
  spent: number;
  budget: number;
  share: number | null; // spent / budget
  state: BudgetState;
}

export function budgetState(spent: number, budget: number): BudgetState {
  if (budget <= 0) return spent > 0 ? 'over' : 'none';
  if (spent > budget) return 'over';
  return spent >= budget * BUDGET_WARNING_SHARE ? 'warning' : 'ok';
}

// Spend against the monthly budget for one month (YYYY-MM)
export function getBudgetReport(expenses: Expense[], budgets: ExpenseBudgets, month: string): BudgetRow[] {
  return EXPENSE_CATEGORIES.map((category) => {
    const spent = expenses.filter((expense) => expense.category === category && monthKey(expense.date) === month).reduce((sum, expense) => sum + expense.amount, 0);
    const budget = budgets[category] ?? 0;
    return { category, spent, budget, share: budget > 0 ? spent / budget : null, state: budgetState(spent, budget) };
  });
}

export interface MonthSpend {
  month: string;
  label: string;
  spent: number;
  budget: number;
}

export function getMonthlySpend(expenses: Expense[], budgets: ExpenseBudgets, months = 3, now: Date = new Date()): MonthSpend[] {
  const totalBudget = EXPENSE_CATEGORIES.reduce((sum, category) => sum + (budgets[category] ?? 0), 0);
  return lastMonths(months, now).map((start) => {
    const key = toMonthKey(start);
    return { month: key, label: monthLabel(start), spent: expenses.filter((expense) => monthKey(expense.date) === key).reduce((sum, expense) => sum + expense.amount, 0), budget: totalBudget };
  });
}

export const currentMonthKey = (now: Date = new Date()) => toMonthKey(now);
