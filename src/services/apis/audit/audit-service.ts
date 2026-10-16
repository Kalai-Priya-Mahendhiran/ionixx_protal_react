import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { generateId } from '@/lib/utils';
import type { AuditEntity, AuditEntry } from '@/types';

/*
 * Who changed what and when, across tasks, projects, templates, settings and automation.
 * Other services call `record`; System Admins read it in Settings → Audit log.
 * In-memory mock (resets on refresh). With the backend every write endpoint records server-side
 * and GET /api/audit?user=&entity=&from=&to= returns the entries.
 */

export interface AuditFilters {
  actorId?: string;
  entity?: AuditEntity;
  // Matches the entity key (e.g. IXP-102) or the summary text
  search?: string;
  from?: string; // YYYY-MM-DD, inclusive
  to?: string; // YYYY-MM-DD, inclusive
}

const MOCK_LATENCY_MS = 150;
const MAX_ENTRIES = 5000;

let entries: AuditEntry[] = [];

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const dayOf = (iso: string) => iso.slice(0, 10);

export function matchesAuditFilters(entry: AuditEntry, filters: AuditFilters): boolean {
  const query = filters.search?.trim().toLowerCase();
  return (
    (!filters.actorId || entry.actorId === filters.actorId) &&
    (!filters.entity || entry.entity === filters.entity) &&
    (!query || entry.entityKey.toLowerCase().includes(query) || entry.summary.toLowerCase().includes(query)) &&
    (!filters.from || dayOf(entry.at) >= filters.from) &&
    (!filters.to || dayOf(entry.at) <= filters.to)
  );
}

export const auditService = {
  record(entry: Omit<AuditEntry, 'id' | 'at'> & { at?: string }): void {
    entries = [{ ...entry, id: generateId(), at: entry.at ?? new Date().toISOString() }, ...entries].slice(0, MAX_ENTRIES);
  },

  // GET /api/audit — newest first
  async list(actor: PermissionUser, filters: AuditFilters = {}): Promise<AuditEntry[]> {
    await delay();
    if (!can(actor, 'workflow.configure')) throw new Error("You don't have permission to view the audit log");
    return entries.filter((entry) => matchesAuditFilters(entry, filters)).sort((a, b) => b.at.localeCompare(a.at));
  },
};
