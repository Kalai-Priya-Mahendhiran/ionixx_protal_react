import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { SelectField, TextField } from '@/components/ui/form-fields';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/desk-config';
import { EXPENSE_CATEGORY_VALUES, expenseSchema, type ExpenseFormValues } from '@/lib/schemas';
import { todayAsDateInput } from '@/lib/utils';
import { useCreateExpense, useUpdateExpense } from '@/services/apis/service-desk/use-service-desk';
import type { Expense, TaskAttachment } from '@/types';
import { AttachmentDropzone, AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';

const emptyValues = (): ExpenseFormValues => ({ date: todayAsDateInput(), category: 'supplies', vendor: '', amount: '', description: '', requestKey: '' });

export function ExpenseDialog({ open, expense, onOpenChange }: { open: boolean; expense?: Expense; onOpenChange: (open: boolean) => void }) {
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
