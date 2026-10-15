import { sampleTaskTemplates } from '@/lib/sample-data/task-template-sample-data';
import type { TemplateOwner } from '@/types';
import { formatOffset, planChecklist, resolveOwner } from './task-templates';

const onboarding = sampleTaskTemplates.find((template) => template.kind === 'onboarding')!;
const hrUser = { id: 'HR001', role: 'hr' };

const ownerFor = (owner: TemplateOwner, actor = hrUser, ownerId?: string) =>
  resolveOwner({ id: 'x', title: 'x', owner, ownerId, offsetDays: 0, priority: 'low' }, 'EMP007', actor);

describe('planChecklist()', () => {
  it('dates every item from the joining day and orders them by day', () => {
    const plan = planChecklist(onboarding, 'EMP007', '2026-10-22', hrUser);
    expect(plan.title).toBe('Onboarding: Sneha Reddy');
    expect(plan.items).toHaveLength(10);
    expect(plan.items[0].dueDate).toBe('2026-10-19'); // Day −3
    expect(plan.items[plan.items.length - 1].dueDate).toBe('2026-11-21'); // Day +30
    expect(plan.startDate).toBe('2026-10-19');
    expect(plan.dueDate).toBe('2026-11-21');
  });

  it('gives each item to the right owner', () => {
    expect(ownerFor('hr')).toBe('HR001');
    expect(ownerFor('it')).toBe('SYS001');
    expect(ownerFor('manager')).toBe('PM001'); // Sneha reports to Priya Kumar
    expect(ownerFor('employee')).toBe('EMP007');
    expect(ownerFor('specific', hrUser, 'EMP003')).toBe('EMP003');
    // An admin applying the template hands HR items to the HR team
    expect(ownerFor('hr', { id: 'ADM001', role: 'admin' })).toBe('HR001');
  });

  it('formats day offsets', () => {
    expect([formatOffset(-3), formatOffset(0), formatOffset(30)]).toEqual(['Day −3', 'Day 0', 'Day +30']);
  });
});
