import type { InfoContent } from '@/components/common-component/info';
import { BUDGET_WARNING_SHARE } from '@/lib/desk-config';

// The ⓘ next to the Office Expenses title. People who can configure the desk also see how budgets work.
export function getExpensesInfo(canSetBudgets: boolean): InfoContent {
  return {
    title: 'About Office Expenses',
    description: "Record what the office spends and see it against each category's monthly budget.",
    sections: [
      {
        heading: 'What you can do here',
        items: [
          'Record an expense: date, amount, category, who was paid and what for',
          'Link an expense to the service request it was for',
          'Pick a month to see what was spent and how much budget is left',
          'Edit or delete an expense if it was entered wrongly',
        ],
      },
      {
        heading: 'Good to know',
        items: [`A category turns amber once ${Math.round(BUDGET_WARNING_SHARE * 100)}% of its budget is used, and red when it goes over`],
      },
      ...(canSetBudgets
        ? [{ heading: 'Setting budgets', items: ['Use Budgets to set the monthly budget for each category, in rupees'] }]
        : []),
    ],
  };
}
