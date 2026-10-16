import { resetSavedFilters, savedFilterService } from './saved-filter-service';

jest.useFakeTimers();
const run = async <T,>(promise: Promise<T>) => {
  jest.runAllTimers();
  return promise;
};

const alice = { id: 'EMP001', role: 'employee' as const };
const bob = { id: 'EMP002', role: 'employee' as const };

describe('savedFilterService', () => {
  beforeEach(() => resetSavedFilters());

  it("keeps each person's filters to themselves", async () => {
    await run(savedFilterService.save(alice, { name: 'Overdue', query: 'due=overdue' }));
    expect(await run(savedFilterService.list(alice))).toHaveLength(1);
    expect(await run(savedFilterService.list(bob))).toHaveLength(0);
  });

  it('replaces a filter saved again under the same name', async () => {
    const first = await run(savedFilterService.save(alice, { name: 'Mine', query: 'due=overdue' }));
    const second = await run(savedFilterService.save(alice, { name: ' mine ', query: 'status=blocked' }));
    expect(second.id).toBe(first.id);
    expect(await run(savedFilterService.list(alice))).toEqual([expect.objectContaining({ query: 'status=blocked' })]);
  });

  it('needs a name and at least one filter or search', async () => {
    await expect(run(savedFilterService.save(alice, { name: '  ', query: 'due=overdue' }))).rejects.toThrow('name');
    await expect(run(savedFilterService.save(alice, { name: 'Empty', query: '', search: '  ' }))).rejects.toThrow('Choose some filters');
    await expect(run(savedFilterService.save(alice, { name: 'Search only', query: '', search: 'login' }))).resolves.toMatchObject({ search: 'login' });
  });

  it("won't let someone delete another person's filter", async () => {
    const saved = await run(savedFilterService.save(alice, { name: 'Overdue', query: 'due=overdue' }));
    await expect(run(savedFilterService.remove(bob, saved.id))).rejects.toThrow();
    await run(savedFilterService.remove(alice, saved.id));
    expect(await run(savedFilterService.list(alice))).toHaveLength(0);
  });
});
