import { LEAVE_TYPES } from '@/lib/constants';
import type { AuditEntry, Holiday, LeaveRequest, Task, TaskUser, TimeEntry } from '@/types';

/*
 * The dashboard's lists, worked out from live data (tasks, leave, holidays, people, time entries, audit log).
 * Each list is a set of small sources, so a new kind of item is one more source here and no component changes.
 * Pure functions: the dashboard passes in what its hooks returned, so it updates whenever that data does.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const parse = (date: string) => new Date(`${date}T00:00:00`);
const daysBetween = (from: string, to: string) => Math.round((parse(to).getTime() - parse(from).getTime()) / DAY_MS);
const leaveLabel = (type: LeaveRequest['leaveType']) => LEAVE_TYPES.find((entry) => entry.id === type)?.label ?? 'Leave';

// This year's (or next year's, if already past) occurrence of a MM-DD date
export function nextOccurrence(date: string, today: string): string {
  const monthDay = date.slice(5);
  const thisYear = `${today.slice(0, 4)}-${monthDay}`;
  return thisYear >= today ? thisYear : `${Number(today.slice(0, 4)) + 1}-${monthDay}`;
}

// ── Upcoming ────────────────────────────────────────────────────────────────

export type UpcomingKind = 'task' | 'leave' | 'holiday' | 'anniversary' | 'birthday';

export interface UpcomingItem {
  id: string;
  date: string;
  kind: UpcomingKind;
  title: string;
  detail: string;
  href?: string;
}

export interface UpcomingInput {
  userId: string;
  today: string;
  tasks: Task[];
  leave: LeaveRequest[];
  holidays: Holiday[];
  people: TaskUser[];
}

type UpcomingSource = (input: UpcomingInput, until: string) => UpcomingItem[];

const UPCOMING_SOURCES: UpcomingSource[] = [
  // Your open tasks due soon
  ({ tasks, userId, today }, until) =>
    tasks
      .filter((task) => task.assigneeId === userId && task.status !== 'done' && task.dueDate && task.dueDate >= today && task.dueDate <= until)
      .map((task) => ({ id: `task-${task.id}`, date: task.dueDate, kind: 'task', title: `${task.key} due`, detail: task.title, href: `/tasks/${task.key}` })),
  // Your approved or pending leave
  ({ leave, today }, until) =>
    leave
      .filter((request) => request.status !== 'rejected' && request.endDate >= today && request.startDate <= until)
      .map((request) => ({
        id: `leave-${request.id}`,
        date: request.startDate < today ? today : request.startDate,
        kind: 'leave',
        title: `${leaveLabel(request.leaveType)}${request.status === 'pending' ? ' (awaiting approval)' : ''}`,
        detail: request.startDate === request.endDate ? request.reason : `${request.startDate} to ${request.endDate} · ${request.reason}`,
        href: '/leave',
      })),
  // Holidays
  ({ holidays, today }, until) =>
    holidays
      .filter((holiday) => holiday.date >= today && holiday.date <= until)
      .map((holiday) => ({ id: `holiday-${holiday.date}`, date: holiday.date, kind: 'holiday', title: holiday.name, detail: holiday.type === 'restricted' ? 'Restricted holiday · optional' : 'Public holiday' })),
  // Colleagues' work anniversaries
  ({ people, today }, until) =>
    people
      .filter((person) => person.joiningDate && person.joiningDate < today)
      .map((person) => ({ person, date: nextOccurrence(person.joiningDate!, today) }))
      .filter(({ date, person }) => date <= until && date.slice(0, 4) !== person.joiningDate!.slice(0, 4))
      .map(({ person, date }) => {
        const years = Number(date.slice(0, 4)) - Number(person.joiningDate!.slice(0, 4));
        return { id: `anniversary-${person.id}`, date, kind: 'anniversary', title: `${person.name}: ${years} ${years === 1 ? 'year' : 'years'} at the company`, detail: person.designation };
      }),
];

export function buildUpcoming(input: UpcomingInput, days = 14): UpcomingItem[] {
  const until = new Date(parse(input.today).getTime() + days * DAY_MS).toISOString().slice(0, 10);
  return UPCOMING_SOURCES.flatMap((source) => source(input, until)).sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));
}

// "Today", "Tomorrow", "In 5 days"
export function relativeDay(date: string, today: string): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

// ── Celebrations ────────────────────────────────────────────────────────────

export interface CelebrationItem {
  person: TaskUser;
  date: string;
  // "28 years", "3 years", "Joined 12 days ago"
  note: string;
  when: string;
}

export interface Celebrations {
  birthdays: CelebrationItem[];
  anniversaries: CelebrationItem[];
  newJoiners: CelebrationItem[];
}

export function buildCelebrations(people: TaskUser[], today: string, windowDays = 30): Celebrations {
  const within = (date: string) => daysBetween(today, date) >= 0 && daysBetween(today, date) <= windowDays;
  const birthdays = people
    .filter((person) => person.birthDate)
    .map((person) => ({ person, date: nextOccurrence(person.birthDate!, today) }))
    .filter(({ date }) => within(date))
    .map(({ person, date }) => ({ person, date, note: `${Number(date.slice(0, 4)) - Number(person.birthDate!.slice(0, 4))} years`, when: relativeDay(date, today) }));
  const anniversaries = people
    .filter((person) => person.joiningDate && person.joiningDate < today)
    .map((person) => ({ person, date: nextOccurrence(person.joiningDate!, today) }))
    .filter(({ date, person }) => within(date) && date.slice(0, 4) !== person.joiningDate!.slice(0, 4))
    .map(({ person, date }) => {
      const years = Number(date.slice(0, 4)) - Number(person.joiningDate!.slice(0, 4));
      return { person, date, note: `${years} ${years === 1 ? 'year' : 'years'}`, when: relativeDay(date, today) };
    });
  const newJoiners = people
    .filter((person) => person.joiningDate && daysBetween(person.joiningDate, today) >= 0 && daysBetween(person.joiningDate, today) <= 90)
    .map((person) => ({ person, date: person.joiningDate!, note: person.designation, when: relativeDay(person.joiningDate!, today) }));
  const byDate = (a: CelebrationItem, b: CelebrationItem) => a.date.localeCompare(b.date);
  return { birthdays: birthdays.sort(byDate), anniversaries: anniversaries.sort(byDate), newJoiners: newJoiners.sort(byDate).reverse() };
}

// ── Recent activity ─────────────────────────────────────────────────────────

export type ActivityKind = 'attendance' | 'leave' | 'task' | 'time' | 'other';

export interface ActivityItem {
  id: string;
  // ISO timestamp, for ordering
  at: string;
  kind: ActivityKind;
  message: string;
  href?: string;
}

export interface ActivityInput {
  audit: AuditEntry[];
  leave: LeaveRequest[];
  timeEntries: TimeEntry[];
  today: string;
  checkIn?: string | null;
  checkOut?: string | null;
}

type ActivitySource = (input: ActivityInput) => ActivityItem[];

const at = (date: string, time = '00:00') => new Date(`${date}T${time}:00`).toISOString();

const ACTIVITY_SOURCES: ActivitySource[] = [
  ({ today, checkIn, checkOut }) => [
    ...(checkIn ? [{ id: 'check-in', at: at(today, checkIn), kind: 'attendance' as const, message: `Checked in at ${checkIn}`, href: '/attendance' }] : []),
    ...(checkOut ? [{ id: 'check-out', at: at(today, checkOut), kind: 'attendance' as const, message: `Checked out at ${checkOut}`, href: '/attendance' }] : []),
  ],
  ({ leave }) =>
    leave.flatMap((request) => [
      { id: `leave-applied-${request.id}`, at: at(request.appliedDate), kind: 'leave' as const, message: `Applied for ${leaveLabel(request.leaveType)} (${request.startDate})`, href: '/leave' },
      ...(request.status !== 'pending' && request.approvedDate
        ? [{ id: `leave-decided-${request.id}`, at: at(request.approvedDate, '12:00'), kind: 'leave' as const, message: `${leaveLabel(request.leaveType)} ${request.status}${request.approvedBy ? ` by ${request.approvedBy}` : ''}`, href: '/leave' }]
        : []),
    ]),
  ({ timeEntries }) => timeEntries.map((entry) => ({ id: `time-${entry.id}`, at: at(entry.date, entry.endTime || '18:00'), kind: 'time' as const, message: `Logged ${entry.totalHours}h on ${entry.project}: ${entry.task}`, href: '/time-tracker' })),
  ({ audit }) => audit.map((entry) => ({ id: `audit-${entry.id}`, at: entry.at, kind: entry.entity === 'task' ? ('task' as const) : ('other' as const), message: `${entry.entityKey}: ${entry.summary}`, href: entry.entity === 'task' ? `/tasks/${entry.entityKey}` : undefined })),
];

export function buildActivity(input: ActivityInput, limit = 6): ActivityItem[] {
  const now = new Date().toISOString();
  return ACTIVITY_SOURCES.flatMap((source) => source(input))
    .filter((item) => item.at <= now)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
}

// "2h ago", "Yesterday", "3 days ago"
export function timeAgo(iso: string, now = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}
