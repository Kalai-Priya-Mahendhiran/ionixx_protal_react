import { templateService } from './template-service';

const hrUser = { id: 'HR001', role: 'hr' as const };
const item = { id: '', title: 'Book a welcome lunch', owner: 'manager' as const, offsetDays: 1, priority: 'low' as const };

describe('templateService', () => {
  it('creates, updates and deletes templates for HR', async () => {
    const created = await templateService.create(hrUser, { name: 'Intern Onboarding', kind: 'onboarding', items: [item] });
    expect(created.items[0].id).not.toBe('');
    const updated = await templateService.update(hrUser, created.id, {
      name: 'Intern Onboarding',
      kind: 'onboarding',
      items: [item, { ...item, title: 'Return badge', offsetDays: 60 }],
    });
    expect(updated.items).toHaveLength(2);
    await templateService.remove(hrUser, created.id);
    expect((await templateService.list(hrUser)).some((template) => template.id === created.id)).toBe(false);
  });

  it('validates names, items and owners', async () => {
    await expect(templateService.create(hrUser, { name: 'New Joiner Onboarding', kind: 'onboarding', items: [item] })).rejects.toThrow('already exists');
    await expect(templateService.create(hrUser, { name: 'Empty', kind: 'custom', items: [] })).rejects.toThrow('at least one item');
    await expect(templateService.create(hrUser, { name: 'No person', kind: 'custom', items: [{ ...item, owner: 'specific' }] })).rejects.toThrow(
      'Choose a person',
    );
  });

  it('is off limits to managers and employees', async () => {
    await expect(templateService.list({ id: 'PM001', role: 'project_manager' })).rejects.toThrow('permission');
  });
});
