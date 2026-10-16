import { DEFAULT_DESK_SETTINGS } from '@/lib/desk-config';
import { budgetState, getBreachedRequests, getBudgetReport, getCategoryReport, getMonthlyTrend, summarizeDesk } from '@/lib/desk-reports';
import type { AdminRequest, Expense } from '@/types';

const NOW = new Date('2026-10-16T12:00:00.000Z');
const hoursBefore = (hours: number) => new Date(NOW.getTime() - hours * 3600000).toISOString();
const sla = DEFAULT_DESK_SETTINGS.sla;

let seq = 0;
const request = (overrides: Partial<AdminRequest>): AdminRequest => {
  seq += 1;
  return {
    id: `R${seq}`,
    key: `ADM-${seq}`,
    category: 'facility',
    title: 'x',
    description: '',
    priority: 'medium',
    status: 'open',
    requesterId: 'EMP001',
    attachments: [],
    source: 'manual',
    createdAt: hoursBefore(1),
    updatedAt: hoursBefore(1),
    pausedMs: 0,
    ...overrides,
  };
};

// Facility: respond in 2h, resolve in 24h
const requests = [
  request({ createdAt: hoursBefore(30), firstResponseAt: hoursBefore(29), resolvedAt: hoursBefore(20), status: 'closed' }), // 10h: met
  request({ createdAt: hoursBefore(60), firstResponseAt: hoursBefore(59), resolvedAt: hoursBefore(30), status: 'resolved' }), // 30h: missed
  request({ createdAt: hoursBefore(5) }), // open, no response for 5h: breached
  request({ category: 'supplies', createdAt: hoursBefore(1) }), // open, fine
];

describe('desk reports', () => {
  it('summarises the queue', () => {
    expect(summarizeDesk(requests, sla, NOW)).toEqual({ total: 4, open: 2, breachedOpen: 1, resolved: 2, avgResolutionMs: 20 * 3600000, slaMetRate: 0.5 });
  });

  it('reports per category', () => {
    const facility = getCategoryReport(requests, sla, NOW).find((row) => row.category === 'facility')!;
    expect(facility).toMatchObject({ total: 3, open: 1, breaches: 2, avgResponseMs: 3600000, avgResolutionMs: 20 * 3600000 });
  });

  it('lists breaches with open ones first', () => {
    const breaches = getBreachedRequests(requests, sla, NOW);
    expect(breaches.map(({ request: item, kind }) => [item.key, kind])).toEqual([
      [requests[2].key, 'response'],
      [requests[1].key, 'resolution'],
    ]);
  });

  it('counts raised and resolved per month', () => {
    const trend = getMonthlyTrend([request({ createdAt: '2026-09-20T10:00:00.000Z', resolvedAt: '2026-10-02T10:00:00.000Z' })], 2, NOW);
    expect(trend).toEqual([
      { month: '2026-09', label: 'Sep', raised: 1, resolved: 0 },
      { month: '2026-10', label: 'Oct', raised: 0, resolved: 1 },
    ]);
  });

  it('flags budgets at 80% and over', () => {
    expect(budgetState(70, 100)).toBe('ok');
    expect(budgetState(80, 100)).toBe('warning');
    expect(budgetState(101, 100)).toBe('over');
    expect(budgetState(0, 0)).toBe('none');
    const expenses = [{ category: 'utilities', date: '2026-10-03', amount: 95000 }, { category: 'utilities', date: '2026-09-03', amount: 5000 }] as Expense[];
    const utilities = getBudgetReport(expenses, DEFAULT_DESK_SETTINGS.budgets, '2026-10').find((row) => row.category === 'utilities')!;
    expect(utilities).toMatchObject({ spent: 95000, budget: 90000, state: 'over' });
  });
});
