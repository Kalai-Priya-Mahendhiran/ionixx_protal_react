import { leaveService } from './leave-service';
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
