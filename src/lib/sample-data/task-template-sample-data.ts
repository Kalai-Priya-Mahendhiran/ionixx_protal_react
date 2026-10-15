import type { TaskTemplate } from '@/types';

const updatedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export const sampleTaskTemplates: TaskTemplate[] = [
  {
    id: 'TPL-ONBOARDING',
    name: 'New Joiner Onboarding',
    kind: 'onboarding',
    description: 'Everything a new joiner needs from the week before day one to their 30-day check-in.',
    updatedById: 'HR001',
    updatedAt,
    items: [
      { id: 'ON-1', title: 'Prepare laptop and accessories', owner: 'it', offsetDays: -3, priority: 'high', estimateHours: 2 },
      { id: 'ON-2', title: 'Create email account and portal login', owner: 'it', offsetDays: -2, priority: 'high', estimateHours: 1 },
      { id: 'ON-3', title: 'Grant system access (VPN, Git, Jira)', owner: 'it', offsetDays: -1, priority: 'high', estimateHours: 1 },
      { id: 'ON-4', title: 'Allocate desk and welcome kit', owner: 'hr', offsetDays: -1, priority: 'medium', estimateHours: 1 },
      { id: 'ON-5', title: 'Issue ID card', owner: 'hr', offsetDays: 0, priority: 'high', estimateHours: 0.5 },
      { id: 'ON-6', title: 'Induction session', owner: 'hr', offsetDays: 0, priority: 'medium', estimateHours: 2 },
      { id: 'ON-7', title: 'Assign an onboarding buddy', owner: 'manager', offsetDays: 0, priority: 'medium', estimateHours: 0.5 },
      { id: 'ON-8', title: 'Acknowledge company policies', owner: 'employee', offsetDays: 2, priority: 'medium', estimateHours: 1 },
      { id: 'ON-9', title: 'Set 30-day goals with the new joiner', owner: 'manager', offsetDays: 5, priority: 'medium', estimateHours: 1 },
      { id: 'ON-10', title: '30-day check-in', owner: 'hr', offsetDays: 30, priority: 'low', estimateHours: 0.5 },
    ],
  },
  {
    id: 'TPL-OFFBOARDING',
    name: 'Employee Offboarding',
    kind: 'offboarding',
    description: 'Hand over work, recover assets and close access before the last working day.',
    updatedById: 'HR001',
    updatedAt,
    items: [
      { id: 'OFF-1', title: 'Plan knowledge transfer', owner: 'manager', offsetDays: -10, priority: 'high', estimateHours: 2 },
      { id: 'OFF-2', title: 'Complete knowledge transfer sessions', owner: 'employee', offsetDays: -3, priority: 'high', estimateHours: 6 },
      { id: 'OFF-3', title: 'Exit interview', owner: 'hr', offsetDays: -2, priority: 'medium', estimateHours: 1 },
      { id: 'OFF-4', title: 'Return laptop and accessories', owner: 'employee', offsetDays: 0, priority: 'high', estimateHours: 0.5 },
      { id: 'OFF-5', title: 'Return ID card', owner: 'employee', offsetDays: 0, priority: 'medium', estimateHours: 0.25 },
      { id: 'OFF-6', title: 'Remove system access and email', owner: 'it', offsetDays: 0, priority: 'urgent', estimateHours: 1 },
      { id: 'OFF-7', title: 'Process full and final settlement', owner: 'hr', offsetDays: 7, priority: 'high', estimateHours: 2 },
      { id: 'OFF-8', title: 'Issue relieving and experience letters', owner: 'hr', offsetDays: 7, priority: 'medium', estimateHours: 1 },
    ],
  },
];
