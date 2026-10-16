import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import { canManageExpenses } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleExpenses } from '@/lib/sample-data/service-desk-sample-data';
import { generateId, todayAsDateInput } from '@/lib/utils';
import type { Expense } from '@/types';
import { auditService } from '../audit/audit-service';

/*
 * Office expenses recorded by the Admin team. In-memory mock (resets on refresh).
 * Endpoints: GET/POST /api/expenses, PATCH/DELETE /api/expenses/:id. Budgets live in desk settings.
 */

export type ExpenseInput = Pick<Expense, 'date' | 'category' | 'vendor' | 'amount' | 'description' | 'receipt' | 'requestKey'>;

const MOCK_LATENCY_MS = 150;
const MAX_AMOUNT = 10_000_000;

let expenses: Expense[] = sampleExpenses.map((expense) => ({ ...expense }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

function assertCanManage(actor: PermissionUser) {
  if (!canManageExpenses(actor)) throw new Error("You don't have permission to manage office expenses");
}

function normalize(input: ExpenseInput): ExpenseInput {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Choose the date of the expense');
  if (input.date > todayAsDateInput()) throw new Error("Expenses can't be dated in the future");
  if (!EXPENSE_CATEGORIES.includes(input.category)) throw new Error('Choose a category');
  const vendor = input.vendor.trim();
  if (!vendor) throw new Error('Add the vendor or payee');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Enter an amount above ₹0');
  if (input.amount > MAX_AMOUNT) throw new Error(`Amounts above ${formatRupees(MAX_AMOUNT)} need finance approval`);
  const requestKey = input.requestKey?.trim().toUpperCase() || undefined;
  if (requestKey && !/^ADM-\d+$/.test(requestKey)) throw new Error('Link a request by its key, e.g. ADM-104');
  return { ...input, vendor, amount: Math.round(input.amount * 100) / 100, description: input.description?.trim() || undefined, requestKey };
}

export const expenseService = {
  // GET /api/expenses
  async list(actor: PermissionUser): Promise<Expense[]> {
    await delay();
    assertCanManage(actor);
    return [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  },

  // POST /api/expenses
  async create(actor: PermissionUser, input: ExpenseInput): Promise<Expense> {
    await delay();
    assertCanManage(actor);
    const expense: Expense = { ...normalize(input), id: generateId(), recordedById: actor.id, createdAt: new Date().toISOString() };
    expenses = [expense, ...expenses];
    auditService.record({
      actorId: actor.id,
      entity: 'expense',
      entityKey: expense.vendor,
      action: 'created',
      summary: `${formatRupees(expense.amount)} · ${EXPENSE_CATEGORY_LABELS[expense.category]} on ${expense.date}`,
    });
    return expense;
  },

  // PATCH /api/expenses/:id
  async update(actor: PermissionUser, id: string, input: ExpenseInput): Promise<Expense> {
    await delay();
    assertCanManage(actor);
    const existing = expenses.find((expense) => expense.id === id);
    if (!existing) throw new Error('That expense no longer exists');
    const updated: Expense = { ...existing, ...normalize(input) };
    expenses = expenses.map((expense) => (expense.id === id ? updated : expense));
    auditService.record({ actorId: actor.id, entity: 'expense', entityKey: updated.vendor, action: 'updated', summary: `${formatRupees(updated.amount)} · ${EXPENSE_CATEGORY_LABELS[updated.category]} on ${updated.date}` });
    return updated;
  },

  // DELETE /api/expenses/:id
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    assertCanManage(actor);
    const existing = expenses.find((expense) => expense.id === id);
    if (!existing) throw new Error('That expense no longer exists');
    expenses = expenses.filter((expense) => expense.id !== id);
    auditService.record({ actorId: actor.id, entity: 'expense', entityKey: existing.vendor, action: 'deleted', summary: `Deleted ${formatRupees(existing.amount)} · ${EXPENSE_CATEGORY_LABELS[existing.category]} on ${existing.date}` });
  },
};

// Test helper
export function resetExpenses() {
  expenses = sampleExpenses.map((expense) => ({ ...expense }));
}
