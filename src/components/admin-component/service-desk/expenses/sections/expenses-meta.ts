import type { BudgetState } from '@/lib/desk-reports';

export const BAR_COLOR: Record<BudgetState, string> = { ok: '#2a78d6', none: '#2a78d6', warning: '#fab219', over: '#d03b3b' };

export const monthName = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
