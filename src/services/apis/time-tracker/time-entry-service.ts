import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleTimeEntries } from '@/lib/sample-data/time-tracker-sample-data';
import { generateId } from '@/lib/utils';
import type { TimeEntry } from '@/types';

/*
 * Time Tracker entries, shared by the Time Tracker page and "Log Work" on tasks.
 * In-memory mock (lasts until refresh); each method mirrors an endpoint in `endpoints.timeEntries`.
 * Users only ever see and change their own entries.
 */

export type TimeEntryInput = Omit<TimeEntry, 'id' | 'userId' | 'status'>;

const MOCK_LATENCY_MS = 150;

let entries: TimeEntry[] = sampleTimeEntries.map((entry) => ({ ...entry }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

function findOwnEntry(actor: PermissionUser, id: string): TimeEntry {
  const entry = entries.find((item) => item.id === id);
  if (!entry || entry.userId !== actor.id) throw new Error('Time entry not found');
  return entry;
}

export const timeEntryService = {
  // GET /api/time-tracker/entries
  async list(actor: PermissionUser): Promise<TimeEntry[]> {
    await delay();
    return entries.filter((entry) => entry.userId === actor.id);
  },

  // POST /api/time-tracker/entries
  async create(actor: PermissionUser, input: TimeEntryInput): Promise<TimeEntry> {
    await delay();
    const entry: TimeEntry = { ...input, id: generateId(), userId: actor.id, status: 'submitted' };
    entries = [entry, ...entries];
    return entry;
  },

  // PATCH /api/time-tracker/entries/:id
  async update(actor: PermissionUser, id: string, changes: Partial<TimeEntryInput>): Promise<TimeEntry> {
    await delay();
    const updated = { ...findOwnEntry(actor, id), ...changes };
    entries = entries.map((entry) => (entry.id === id ? updated : entry));
    return updated;
  },

  // DELETE /api/time-tracker/entries/:id
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    findOwnEntry(actor, id);
    entries = entries.filter((entry) => entry.id !== id);
  },
};
