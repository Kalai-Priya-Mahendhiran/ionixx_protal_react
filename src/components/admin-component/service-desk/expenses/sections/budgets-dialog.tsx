import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/ui/form-dialog';
import { TextField } from '@/components/ui/form-fields';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '@/lib/desk-config';
import { budgetsSchema, type BudgetsFormValues } from '@/lib/form-schemas/desk';
import { useSaveBudgets } from '@/services/apis/service-desk/use-service-desk';
import type { ExpenseBudgets } from '@/types';

const toBudgetValues = (budgets: ExpenseBudgets) => Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category, String(budgets[category])])) as BudgetsFormValues;

export function BudgetsDialog({ open, budgets, onOpenChange }: { open: boolean; budgets: ExpenseBudgets; onOpenChange: (open: boolean) => void }) {
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
