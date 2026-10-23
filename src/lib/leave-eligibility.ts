import type { ProfileFormData } from '@/lib/schemas';

/*
 * Leave types that depend on who is applying. Maternity leave is for women and paternity leave for men;
 * people who chose "Other" or "Prefer not to say" in their profile are offered both, so nobody is
 * shut out by a profile choice. The apply form and the leave service both use this, so the rule is
 * also enforced when a request reaches the server.
 */

export type Gender = NonNullable<ProfileFormData['gender']>;

export function isLeaveTypeAvailable(leaveType: string, gender: Gender | undefined): boolean {
  if (leaveType === 'maternity') return gender !== 'Male';
  if (leaveType === 'paternity') return gender !== 'Female';
  return true;
}

export function leaveTypeUnavailableReason(leaveType: string): string {
  return leaveType === 'maternity' ? 'Maternity leave is for women employees' : 'Paternity leave is for men employees';
}
