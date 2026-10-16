import { DEFAULT_DESK_SETTINGS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { canConfigureDesk } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { DeskSettings, ExpenseBudgets, RequestCategory, SlaTarget, SlaTargets } from '@/types';
import { auditService } from '../audit/audit-service';

/*
 * Service desk settings: SLA targets per request category and monthly expense budgets.
 * In-memory mock (resets on refresh). Endpoints: GET/PUT /api/service-desk/sla and GET/PUT /api/expenses/budgets.
 */

const MOCK_LATENCY_MS = 150;
const MAX_HOURS = 24 * 30;

const clone = (settings: DeskSettings): DeskSettings => JSON.parse(JSON.stringify(settings));

let settings: DeskSettings = clone(DEFAULT_DESK_SETTINGS);

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// Read synchronously by the request service (SLA clocks) and the screens
export const getDeskSettings = (): DeskSettings => settings;
export const getSlaTarget = (category: RequestCategory): SlaTarget => settings.sla[category];

function assertCanConfigure(actor: PermissionUser) {
  if (!canConfigureDesk(actor)) throw new Error("You don't have permission to change service desk settings");
}

export function validateSla(sla: SlaTargets): void {
  REQUEST_CATEGORIES.forEach((category) => {
    const target = sla[category];
    const label = REQUEST_CATEGORY_LABELS[category];
    if (!target || !Number.isFinite(target.responseHours) || !Number.isFinite(target.resolutionHours)) throw new Error(`Set both targets for ${label}`);
    if (target.responseHours <= 0 || target.resolutionHours <= 0) throw new Error(`${label}: targets must be more than 0 hours`);
    if (target.resolutionHours > MAX_HOURS) throw new Error(`${label}: resolution can be at most ${MAX_HOURS} hours (30 days)`);
    if (target.responseHours > target.resolutionHours) throw new Error(`${label}: the response target can't be longer than the resolution target`);
  });
}

export const deskSettingsService = {
  // GET /api/service-desk/settings
  async get(): Promise<DeskSettings> {
    await delay();
    return settings;
  },

  // PUT /api/service-desk/sla
  async saveSla(actor: PermissionUser, sla: SlaTargets): Promise<DeskSettings> {
    await delay();
    assertCanConfigure(actor);
    validateSla(sla);
    const changed = REQUEST_CATEGORIES.filter(
      (category) => sla[category].responseHours !== settings.sla[category].responseHours || sla[category].resolutionHours !== settings.sla[category].resolutionHours,
    ).map((category) => `${REQUEST_CATEGORY_LABELS[category]}: ${sla[category].responseHours}h / ${sla[category].resolutionHours}h`);
    settings = clone({ ...settings, sla });
    auditService.record({ actorId: actor.id, entity: 'settings', entityKey: 'Service desk SLA', action: 'updated', summary: changed.length ? `SLA targets: ${changed.join('; ')}` : 'SLA targets saved (no changes)' });
    return settings;
  },

  // PUT /api/expenses/budgets
  async saveBudgets(actor: PermissionUser, budgets: ExpenseBudgets): Promise<DeskSettings> {
    await delay();
    assertCanConfigure(actor);
    EXPENSE_CATEGORIES.forEach((category) => {
      const amount = budgets[category];
      if (!Number.isFinite(amount) || amount < 0) throw new Error(`${EXPENSE_CATEGORY_LABELS[category]}: enter a budget of ₹0 or more`);
    });
    settings = clone({ ...settings, budgets });
    auditService.record({ actorId: actor.id, entity: 'expense', entityKey: 'Budgets', action: 'updated', summary: 'Monthly expense budgets updated' });
    return settings;
  },
};

// Test helper
export function resetDeskSettings() {
  settings = clone(DEFAULT_DESK_SETTINGS);
}
