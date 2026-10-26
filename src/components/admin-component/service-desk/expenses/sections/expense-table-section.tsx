import { Link } from 'react-router-dom';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EXPENSE_CATEGORY_LABELS, formatRupees } from '@/lib/desk-config';
import { getUserById } from '@/lib/user-directory';
import { formatDate } from '@/lib/utils';
import type { Expense } from '@/types';
import { requestPath } from '@/components/admin-component/service-desk/sections/desk-links';

interface ExpenseTableSectionProps {
  // The month's expenses
  expenses: Expense[];
  // Their total, for the footer
  spent: number;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTableSection({ expenses, spent, onEdit, onDelete }: ExpenseTableSectionProps) {
  return (
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
          {expenses.map((expense) => (
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
                    <DropdownMenuItem onSelect={() => onEdit(expense)}>
                      <Pencil className="text-gray-500" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(expense)} className="text-red-600">
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
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatRupees(spent)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
