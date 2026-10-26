import type { AdminRequest, TaskPriority } from '@/types';

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
export const SOURCE_LABELS: Record<AdminRequest['source'], string> = {
  manual: 'Raised in the service desk',
  onboarding: 'Created by an HR onboarding checklist',
  offboarding: 'Created by an HR offboarding checklist',
  checklist: 'Created by an HR checklist',
};

export const selectClass = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-sm';
