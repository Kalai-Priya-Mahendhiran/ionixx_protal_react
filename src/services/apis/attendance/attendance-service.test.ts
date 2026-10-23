import { todayAsDateInput } from '@/lib/utils';
import { leaveService } from '../leave/leave-service';
import { attendancePercent, attendanceService, resetAttendance } from './attendance-service';

const employee = { id: 'EMP001', role: 'employee' as const };
const manager = { id: 'PM001', role: 'project_manager' as const };
const hr = { id: 'HR001', role: 'hr' as const };
const today = todayAsDateInput();

describe('attendance', () => {
  beforeEach(() => resetAttendance());

  it("shows a check-in on the manager's team view straight away", async () => {
    await attendanceService.checkIn(employee);
    const mine = await attendanceService.today(employee);
    expect(mine.checkIn).toMatch(/^\d{2}:\d{2}$/);
    expect(mine.checkOut).toBeNull();

    const row = (await attendanceService.team(manager)).find((entry) => entry.userId === 'EMP001');
    expect(row?.checkIn).toBe(mine.checkIn);
    expect(['present', 'late', 'half-day', 'wfh', 'leave', 'holiday']).toContain(row?.status);
  });

  it('records check-out and refuses a second check-in while still in', async () => {
    await attendanceService.checkIn(employee);
    await expect(attendanceService.checkIn(employee)).rejects.toThrow('already checked in');
    const after = await attendanceService.checkOut(employee);
    expect(after.checkOut).not.toBeNull();
  });

  it('treats approved leave as on leave, whatever the check-in', async () => {
    const request = await leaveService.apply(employee, { leaveType: 'casual', startDate: today, startDayPart: 'full-day', endDate: today, endDayPart: 'full-day', days: 1, reason: 'Unwell' });
    await leaveService.decide(manager, request.id, 'approved');
    expect((await attendanceService.today(employee)).status).toBe('leave');
    expect((await attendanceService.team(manager)).find((entry) => entry.userId === 'EMP001')?.status).toBe('leave');
  });

  it("only shows a manager their own team, and HR everyone", async () => {
    const team = (await attendanceService.team(manager)).map((entry) => entry.userId);
    expect(team).toContain('EMP002');
    expect(team).not.toContain('ADM002');
    expect((await attendanceService.team(hr)).map((entry) => entry.userId)).toContain('ADM002');
  });

  it('keeps a resolved note, and only for people in your team', async () => {
    await attendanceService.resolve(manager, 'EMP006', today, 'Doctor visit, informed by phone');
    const row = (await attendanceService.team(manager)).find((entry) => entry.userId === 'EMP006');
    expect(row).toMatchObject({ note: 'Doctor visit, informed by phone', resolved: true });
    await expect(attendanceService.resolve(employee, 'EMP002', today, 'x')).rejects.toThrow();
  });

  it('builds a month with one entry per day up to today', async () => {
    const month = today.slice(0, 7);
    const days = await attendanceService.month(employee, month);
    expect(days.at(-1)?.date).toBe(today);
    expect(days.every((day) => day.date.startsWith(month))).toBe(true);
  });
});

describe('attendance rules through the day', () => {
  // A future Wednesday (no seeded history, not a holiday); only Date is faked so the service's timers still run
  const at = (time: string) =>
    jest.useFakeTimers({ now: new Date(`2027-02-10T${time}:00`), doNotFake: ['setTimeout', 'setInterval', 'setImmediate', 'nextTick', 'queueMicrotask'] });
  const person = { id: 'EMP003', role: 'employee' as const };
  afterEach(() => {
    jest.useRealTimers();
    resetAttendance();
  });

  it('does not mark anyone absent until the working day is over', async () => {
    at('15:00');
    expect((await attendanceService.today(person)).status).toBe('not-in-yet');
    at('19:00');
    expect((await attendanceService.today(person)).status).toBe('absent');
  });

  it('counts a check-in after 1:30 PM as a half day, not late', async () => {
    at('15:11');
    await attendanceService.checkIn(person);
    expect((await attendanceService.today(person)).status).toBe('half-day');
  });

  it('counts half days as half, and ignores today until it counts', () => {
    expect(attendancePercent([{ status: 'present' }, { status: 'half-day' }]).percent).toBe(75);
    expect(attendancePercent([{ status: 'present' }, { status: 'not-in-yet' }, { status: 'holiday' }])).toEqual({ percent: 100, workingDays: 1 });
  });

  it('gives every screen the same presence, from attendance', async () => {
    at('10:00');
    expect((await attendanceService.presence())['EMP003']).toBe('not-in');
    await attendanceService.checkIn(person);
    expect((await attendanceService.presence())['EMP003']).toBe('in-office');
  });
});
