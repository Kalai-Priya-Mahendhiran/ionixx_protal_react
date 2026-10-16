import { sampleAccessRecords } from '@/lib/sample-data/user-access-sample-data';
import type { AccessRecord } from '@/types';

/*
 * Account status and per-person page access, read synchronously by sign-in, the page guard,
 * the sidebar and every people picker. Written only by the user access service.
 * Kept free of other app imports so permission helpers can use it without import cycles.
 * With the backend this comes from GET /api/users and is enforced server-side.
 */

const DEFAULT_RECORD: AccessRecord = { status: 'active', grantedModules: [], revokedModules: [] };

let records: Record<string, AccessRecord> = structuredCloneRecords(sampleAccessRecords);

function structuredCloneRecords(source: Record<string, AccessRecord>): Record<string, AccessRecord> {
  return Object.fromEntries(Object.entries(source).map(([id, record]) => [id, { ...record, grantedModules: [...record.grantedModules], revokedModules: [...record.revokedModules] }]));
}

export function getAccessRecord(userId: string): AccessRecord {
  return records[userId] ?? DEFAULT_RECORD;
}

export function setAccessRecord(userId: string, record: AccessRecord): void {
  records = { ...records, [userId]: record };
}

// Only active people can sign in, be assigned work or show up in pickers
export const isUserActive = (userId: string | undefined) => !!userId && getAccessRecord(userId).status === 'active';

// Test helper
export function resetAccessRecords() {
  records = structuredCloneRecords(sampleAccessRecords);
}
