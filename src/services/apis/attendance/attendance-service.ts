import { HOLIDAYS_BY_COUNTRY } from '@/lib/sample-data/leave-tracker-sample-data';
import { getOrgPeople, teamBelow } from '@/lib/org-chart';
import { MOCK_USERS } from '@/lib/mock-users';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { toDateInput, todayAsDateInput } from '@/lib/utils';
import { leaveService } from '../leave/leave-service';
import { approvedWfhOn } from '../approvals/work-request-service';

/*
 * Attendance: check-in/out, each person's history, and the manager's view of their team today.
 * In-memory mock (lasts until refresh). Endpoints: POST /api/attendance/check-in|check-out,
 * GET /api/attendance/me?month=YYYY-MM, GET /api/attendance/team?date=, POST /api/attendance/:userId/:date/resolve.
 * Leave and work-from-home come from their own services, so approving them changes attendance straight away.
 */

export const OFFICE_HOURS = {
  // Checking in after this is late
  start: '09:30',
  // Checking in after this only leaves half a working day, so the day is a half day
  halfDayAfter: '13:30',
  // The working day ends here: only then does a day with no check-in count as absent
  end: '18:30',
  // Fewer hours than this (once checked out) is a half day
  halfDayHours: 4,
};

// Statuses that count as attending; a half day counts as half
const ATTENDANCE_WEIGHT: Partial<Record<AttendanceStatus, number>> = { present: 1, late: 1, wfh: 1, 'half-day': 0.5, absent: 0 };

// Share of working days attended, for the dashboard and the Attendance page alike.
// Holidays, leave and today before the person has checked in don't count either way.
export function attendancePercent(records: Pick<AttendanceRecord, 'status'>[]): { percent: number; workingDays: number } {
  const counted = records.filter((record) => ATTENDANCE_WEIGHT[record.status] !== undefined);
  if (counted.length === 0) return { percent: 100, workingDays: 0 };
  const attended = counted.reduce((total, record) => total + (ATTENDANCE_WEIGHT[record.status] ?? 0), 0);
  return { percent: Math.round((attended / counted.length) * 100), workingDays: counted.length };
}

export type AttendanceStatus = 'present' | 'late' | 'half-day' | 'absent' | 'leave' | 'wfh' | 'holiday' | 'not-in-yet';

export interface AttendanceRecord {
  userId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  // Hours between check-in and check-out (or now, while still checked in today)
  hoursWorked: number;
  status: AttendanceStatus;
  // Manager's note on a late/absent day, and whether they've dealt with it
  note?: string;
  resolved?: boolean;
}

export interface TeamAttendanceRow extends AttendanceRecord {
  name: string;
  designation: string;
  employeeId: string;
  // Why the day needs attention, e.g. "Late by 18 minutes"
  exception?: string;
}

interface StoredDay {
  checkIn: string | null;
  checkOut: string | null;
  note?: string;
  resolved?: boolean;
}

const MOCK_LATENCY_MS = 120;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const nowTime = () => {
  const now = new Date();
  return toTime(now.getHours() * 60 + now.getMinutes());
};

const HOLIDAYS = new Set(HOLIDAYS_BY_COUNTRY.india.filter((holiday) => holiday.type === 'public').map((holiday) => holiday.date));
const isWorkingDay = (date: string) => {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day !== 0 && day !== 6 && !HOLIDAYS.has(date);
};

// ── Sample history ──────────────────────────────────────────────────────────

// Same answer every time for the same person and day, so the sample history is stable
const hash = (text: string) => [...text].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);

const LOGIN_IDS = new Set(MOCK_USERS.map((user) => user.id));

// How far back the sample history goes (and how far the calendar lets you page back)
export const HISTORY_DAYS = 185;

function sampleDay(userId: string, date: string): StoredDay | null {
  const roll = hash(`${userId}:${date}`) % 100;
  if (roll < 3) return null; // absent
  const checkIn = roll < 11 ? 9 * 60 + 35 + (roll % 25) : 8 * 60 + 45 + (roll % 40); // late or on time
  const hours = roll < 14 && roll >= 11 ? 3.5 : 8 + (roll % 10) / 10; // a few half days
  return { checkIn: toTime(checkIn), checkOut: toTime(checkIn + Math.round(hours * 60)) };
}

const days = new Map<string, StoredDay>();
const keyOf = (userId: string, date: string) => `${userId}|${date}`;

function seed() {
  days.clear();
  const today = todayAsDateInput();
  for (const person of getActiveUsers()) {
    const joined = person.joiningDate ?? '2000-01-01';
    // About six months of history, so the Attendance calendar can be paged back
    for (let back = HISTORY_DAYS; back >= 1; back -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - back);
      const day = toDateInput(date);
      if (day < joined || !isWorkingDay(day)) continue;
      const stored = sampleDay(person.id, day);
      if (stored) days.set(keyOf(person.id, day), stored);
    }
    // Colleagues without a demo login have already checked in today; demo logins check in themselves
    if (!LOGIN_IDS.has(person.id) && isWorkingDay(today)) {
      const stored = sampleDay(person.id, today);
      if (stored && hash(person.id) % 7 !== 0) days.set(keyOf(person.id, today), { checkIn: stored.checkIn, checkOut: null });
    }
  }
}
seed();

// ── Working out a day's status ──────────────────────────────────────────────

// Where someone is today, from their attendance: the one status Team Overview, the org chart and the directory show
export type Presence = 'in-office' | 'remote' | 'on-leave' | 'not-in';

export function presenceOf(status: AttendanceStatus): Presence {
  switch (status) {
    case 'present':
    case 'late':
    case 'half-day':
      return 'in-office';
    case 'wfh':
      return 'remote';
    case 'leave':
      return 'on-leave';
    default:
      return 'not-in';
  }
}

interface DayContext {
  onLeave: boolean;
  wfh: boolean;
}

function describe(userId: string, date: string, stored: StoredDay | undefined, context: DayContext): AttendanceRecord {
  const today = todayAsDateInput();
  const base = { userId, date, note: stored?.note, resolved: stored?.resolved };
  if (context.onLeave) return { ...base, checkIn: null, checkOut: null, hoursWorked: 0, status: 'leave' };
  if (!isWorkingDay(date)) return { ...base, checkIn: stored?.checkIn ?? null, checkOut: stored?.checkOut ?? null, hoursWorked: 0, status: 'holiday' };
  if (!stored?.checkIn) {
    // Today isn't over until the working day ends, so no check-in yet is "not in yet", not absent
    const waiting = date === today && nowTime() < OFFICE_HOURS.end;
    return { ...base, checkIn: null, checkOut: null, hoursWorked: 0, status: context.wfh ? 'wfh' : waiting ? 'not-in-yet' : 'absent' };
  }
  const end = stored.checkOut ?? (date === today ? nowTime() : stored.checkIn);
  const hoursWorked = Math.max(toMinutes(end) - toMinutes(stored.checkIn), 0) / 60;
  const finished = !!stored.checkOut;
  const status: AttendanceStatus = context.wfh
    ? 'wfh'
    : stored.checkIn > OFFICE_HOURS.halfDayAfter || (finished && hoursWorked < OFFICE_HOURS.halfDayHours)
      ? 'half-day'
      : stored.checkIn > OFFICE_HOURS.start
        ? 'late'
        : 'present';
  return { ...base, checkIn: stored.checkIn, checkOut: stored.checkOut, hoursWorked: Math.round(hoursWorked * 100) / 100, status };
}

async function leaveAndWfhOn(date: string) {
  const [absences, wfh] = [await leaveService.listAbsences(), approvedWfhOn(date)];
  const covers = (userId: string, day: string) => absences.some((absence) => absence.userId === userId && absence.startDate <= day && day <= absence.endDate);
  return { covers, wfh, absences };
}

const lateBy = (checkIn: string) => toMinutes(checkIn) - toMinutes(OFFICE_HOURS.start);

// People whose attendance someone can see: their whole team; HR and leadership see everyone
function visiblePeople(actor: PermissionUser) {
  const people = getOrgPeople().filter((person) => person.status !== 'invited');
  if (actor.role === 'hr' || actor.role === 'executive') return people.filter((person) => person.id !== actor.id);
  return teamBelow(people, actor.id);
}

export const attendanceService = {
  // POST /api/attendance/check-in
  async checkIn(actor: PermissionUser): Promise<AttendanceRecord> {
    await delay();
    const date = todayAsDateInput();
    const existing = days.get(keyOf(actor.id, date));
    if (existing?.checkIn && !existing.checkOut) throw new Error('You are already checked in');
    // Checking in again after checking out keeps the first check-in and reopens the day
    days.set(keyOf(actor.id, date), { ...existing, checkIn: existing?.checkIn ?? nowTime(), checkOut: null });
    return this.today(actor);
  },

  // POST /api/attendance/check-out
  async checkOut(actor: PermissionUser): Promise<AttendanceRecord> {
    await delay();
    const date = todayAsDateInput();
    const existing = days.get(keyOf(actor.id, date));
    if (!existing?.checkIn) throw new Error("You haven't checked in today");
    days.set(keyOf(actor.id, date), { ...existing, checkOut: nowTime() });
    return this.today(actor);
  },

  // GET /api/attendance/me/today
  async today(actor: PermissionUser): Promise<AttendanceRecord> {
    const date = todayAsDateInput();
    const { covers, wfh } = await leaveAndWfhOn(date);
    return describe(actor.id, date, days.get(keyOf(actor.id, date)), { onLeave: covers(actor.id, date), wfh: wfh.includes(actor.id) });
  },

  // GET /api/attendance/me?month=YYYY-MM — one entry per day of the month up to today
  async month(actor: PermissionUser, month: string): Promise<AttendanceRecord[]> {
    await delay();
    const [year, monthNumber] = month.split('-').map(Number);
    const last = new Date(year, monthNumber, 0).getDate();
    const today = todayAsDateInput();
    const { covers } = await leaveAndWfhOn(today);
    const joined = getUserById(actor.id)?.joiningDate ?? '2000-01-01';
    const records: AttendanceRecord[] = [];
    for (let dayNumber = 1; dayNumber <= last; dayNumber += 1) {
      const date = `${month}-${String(dayNumber).padStart(2, '0')}`;
      if (date > today || date < joined) continue;
      const wfh = approvedWfhOn(date).includes(actor.id);
      records.push(describe(actor.id, date, days.get(keyOf(actor.id, date)), { onLeave: covers(actor.id, date), wfh }));
    }
    return records;
  },

  // GET /api/attendance/team?date= — the actor's team (everyone for HR and leadership)
  async team(actor: PermissionUser, date = todayAsDateInput()): Promise<TeamAttendanceRow[]> {
    await delay();
    const { covers, wfh } = await leaveAndWfhOn(date);
    return visiblePeople(actor).map((person) => {
      const record = describe(person.id, date, days.get(keyOf(person.id, date)), { onLeave: covers(person.id, date), wfh: wfh.includes(person.id) });
      const exception =
        record.status === 'late' && record.checkIn
          ? `Late by ${lateBy(record.checkIn)} minutes`
          : record.status === 'absent'
            ? 'No check-in recorded'
            : record.status === 'half-day'
              ? record.checkIn && record.checkIn > OFFICE_HOURS.halfDayAfter
                ? `Checked in at ${record.checkIn} (half day)`
                : `Only ${record.hoursWorked.toFixed(1)}h worked`
              : undefined;
      return { ...record, name: person.name, designation: person.designation, employeeId: person.employeeId, exception };
    });
  },

  // GET /api/attendance/presence — where everyone is today (no times), so every screen shows the same status
  async presence(date = todayAsDateInput()): Promise<Record<string, Presence>> {
    await delay();
    const { covers, wfh } = await leaveAndWfhOn(date);
    return Object.fromEntries(
      getActiveUsers().map((person) => [
        person.id,
        presenceOf(describe(person.id, date, days.get(keyOf(person.id, date)), { onLeave: covers(person.id, date), wfh: wfh.includes(person.id) }).status),
      ]),
    );
  },

  // POST /api/attendance/:userId/:date/resolve — the manager explains a late/absent day
  async resolve(actor: PermissionUser, userId: string, date: string, note: string): Promise<void> {
    await delay();
    if (!visiblePeople(actor).some((person) => person.id === userId)) throw new Error("You can't update this person's attendance");
    const existing = days.get(keyOf(userId, date)) ?? { checkIn: null, checkOut: null };
    days.set(keyOf(userId, date), { ...existing, note: note.trim(), resolved: true });
  },
};

// Test helper
export const resetAttendance = seed;
