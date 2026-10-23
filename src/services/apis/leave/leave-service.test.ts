import { todayAsDateInput } from '@/lib/utils';
import { approverOf, describeRoute, leaveService } from './leave-service';
import { findAbsence } from './use-leave';

describe('leave for task warnings', () => {
  it('shares approved absences as dates only', async () => {
    const absences = await leaveService.listAbsences();
    expect(absences.length).toBeGreaterThan(0);
    absences.forEach((absence) => expect(Object.keys(absence).sort()).toEqual(['endDate', 'startDate', 'userId']));
  });

  it('finds the absence covering a date, including both ends', () => {
    const absences = [{ userId: 'EMP002', startDate: '2026-10-19', endDate: '2026-10-21' }];
    expect(findAbsence(absences, 'EMP002', '2026-10-19')).toBeDefined();
    expect(findAbsence(absences, 'EMP002', '2026-10-21')).toBeDefined();
    expect(findAbsence(absences, 'EMP002', '2026-10-22')).toBeUndefined();
    expect(findAbsence(absences, 'EMP003', '2026-10-20')).toBeUndefined();
  });

  it("lists only the caller's own requests", async () => {
    const mine = await leaveService.list({ id: 'EMP001', role: 'employee' });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((request) => request.userId === 'EMP001')).toBe(true);
  });
});

describe('leave rules', () => {
  const kalai = { id: 'EMP001', role: 'employee' as const }; // Female in the sample profiles
  const arjun = { id: 'EMP002', role: 'employee' as const }; // Male
  const base = { startDate: '2027-01-11', startDayPart: 'full-day' as const, endDate: '2027-01-12', endDayPart: 'full-day' as const, days: 2, reason: 'Family' };

  it('only accepts maternity / paternity leave for the right people', async () => {
    await expect(leaveService.apply(kalai, { ...base, leaveType: 'paternity' })).rejects.toThrow('Paternity');
    await expect(leaveService.apply(arjun, { ...base, leaveType: 'maternity' })).rejects.toThrow('Maternity');
    await expect(leaveService.apply(arjun, { ...base, leaveType: 'paternity', startDate: '2027-02-01', endDate: '2027-02-02' })).resolves.toMatchObject({ status: 'pending' });
  });

  it('refuses a from date after the to date', async () => {
    await expect(leaveService.apply(kalai, { ...base, leaveType: 'casual', startDate: '2027-03-05', endDate: '2027-03-01' })).rejects.toThrow('before from date');
  });

  it('sends requests to HR when the manager is on leave today, and only to HR', async () => {
    const executive = { id: 'EXE001', role: 'executive' as const };
    const manager = { id: 'PM001', role: 'project_manager' as const };
    const hr = { id: 'HR001', role: 'hr' as const };
    const today = todayAsDateInput();
    const away = await leaveService.apply(manager, { ...base, leaveType: 'casual', startDate: today, endDate: today, days: 1 });
    await leaveService.decide(executive, away.id, 'approved');

    expect(approverOf('EMP001')).toEqual({ to: 'hr', why: 'manager-away' });
    expect(describeRoute('EMP001')).toContain('Priya Kumar is on leave');
    const request = await leaveService.apply(kalai, { ...base, leaveType: 'casual', startDate: '2027-04-01', endDate: '2027-04-01', days: 1 });
    expect((await leaveService.listForApprover(hr)).some((entry) => entry.id === request.id)).toBe(true);
    expect((await leaveService.listForApprover(manager)).some((entry) => entry.id === request.id)).toBe(false);
  });
});
