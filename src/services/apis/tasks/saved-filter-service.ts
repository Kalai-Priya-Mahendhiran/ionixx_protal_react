import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { generateId } from '@/lib/utils';
import type { SavedFilter } from '@/types';

/*
 * Each person's saved task filters. In-memory mock (lasts until refresh).
 * Backend: GET/POST /api/tasks/saved-filters and DELETE /api/tasks/saved-filters/:id,
 * always scoped to the signed-in user; nobody can read or remove someone else's filters.
 */

export type SavedFilterInput = Pick<SavedFilter, 'name' | 'query' | 'search'>;

const MOCK_LATENCY_MS = 150;
const MAX_PER_USER = 20;
const MAX_NAME_LENGTH = 40;

let savedFilters: SavedFilter[] = [];

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

export const savedFilterService = {
  // GET /api/tasks/saved-filters
  async list(actor: PermissionUser): Promise<SavedFilter[]> {
    await delay();
    return savedFilters.filter((filter) => filter.ownerId === actor.id);
  },

  // POST /api/tasks/saved-filters (a name that's already used replaces that filter)
  async save(actor: PermissionUser, input: SavedFilterInput): Promise<SavedFilter> {
    await delay();
    const name = input.name.trim();
    if (!name) throw new Error('Give the filter a name');
    if (name.length > MAX_NAME_LENGTH) throw new Error(`Keep the name under ${MAX_NAME_LENGTH} characters`);
    const search = input.search?.trim() || undefined;
    if (!input.query && !search) throw new Error('Choose some filters before saving');

    const mine = savedFilters.filter((filter) => filter.ownerId === actor.id);
    const existing = mine.find((filter) => filter.name.toLowerCase() === name.toLowerCase());
    if (!existing && mine.length >= MAX_PER_USER) throw new Error(`You can save up to ${MAX_PER_USER} filters; delete one first`);

    const saved: SavedFilter = { id: existing?.id ?? generateId(), ownerId: actor.id, name, query: input.query, search, createdAt: existing?.createdAt ?? new Date().toISOString() };
    savedFilters = existing ? savedFilters.map((filter) => (filter.id === existing.id ? saved : filter)) : [...savedFilters, saved];
    return saved;
  },

  // DELETE /api/tasks/saved-filters/:id
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    const filter = savedFilters.find((item) => item.id === id);
    if (!filter || filter.ownerId !== actor.id) throw new Error('That saved filter no longer exists');
    savedFilters = savedFilters.filter((item) => item.id !== id);
  },
};

// Test helper
export function resetSavedFilters() {
  savedFilters = [];
}
