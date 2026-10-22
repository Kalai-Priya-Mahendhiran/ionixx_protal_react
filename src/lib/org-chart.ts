import type { UserRole } from '@/lib/mock-users';
import { DEPARTMENTS, ORG_REPORTING_LINES, PERSON_DETAILS, type DepartmentInfo, type WorkStatus } from '@/lib/sample-data/organization-sample-data';
import { teamMembers } from '@/lib/team-data';
import { getAccessRecord } from '@/lib/user-access-store';
import { USER_DIRECTORY } from '@/lib/user-directory';

/*
 * Organization chart: who reports to whom, departments and the people directory.
 * Built from the user directory every time it is read, so people added, moved or deactivated in
 * User Management show up straight away (see useOrgPeople). Invited people appear as "Yet to join".
 */

export interface OrgPerson {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  department: string;
  managerId?: string;
  employeeId: string;
  phone?: string;
  location?: string;
  joiningDate?: string;
  status: WorkStatus;
}

const ROSTER_STATUS: Record<string, WorkStatus> = { active: 'in-office', remote: 'remote', 'on-leave': 'on-leave' };

export function getOrgPeople(): OrgPerson[] {
  // Deactivated people leave the chart; invited people stay, marked as yet to join
  const current = USER_DIRECTORY.filter((user) => getAccessRecord(user.id).status !== 'deactivated');
  const people = current.map((user): OrgPerson => {
    const roster = teamMembers.find((member) => member.id === user.id);
    const extra = PERSON_DETAILS[user.id];
    return {
      id: user.id,
      name: user.name,
      email: roster?.email ?? user.email,
      role: user.role,
      designation: user.designation,
      department: user.department,
      managerId: user.managerId ?? ORG_REPORTING_LINES[user.id],
      employeeId: roster?.employeeId ?? extra?.employeeId ?? user.id,
      phone: user.phone ?? roster?.phone ?? extra?.phone,
      location: user.location ?? roster?.location ?? extra?.location,
      joiningDate: roster?.joiningDate ?? extra?.joiningDate ?? user.joiningDate,
      status: getAccessRecord(user.id).status === 'invited' ? 'invited' : ((roster ? ROSTER_STATUS[roster.status] : undefined) ?? extra?.status ?? 'in-office'),
    };
  });
  // A manager who is no longer active would hide their team, so those people move up to the top level
  const ids = new Set(people.map((person) => person.id));
  return people.map((person) => (person.managerId && !ids.has(person.managerId) ? { ...person, managerId: undefined } : person));
}

// Everyone below a manager, at any depth (their whole team), top level first
export function teamBelow(people: OrgPerson[], managerId: string): OrgPerson[] {
  return directReports(people, managerId).flatMap((person) => [person, ...teamBelow(people, person.id)]);
}

// Marks people on approved leave today; kept separate so org-chart stays free of service imports
export function withLeaveToday(people: OrgPerson[], absences: { userId: string; startDate: string; endDate: string }[], today: string): OrgPerson[] {
  const away = new Set(absences.filter((absence) => absence.startDate <= today && today <= absence.endDate).map((absence) => absence.userId));
  return people.map((person) => (away.has(person.id) && person.status !== 'invited' ? { ...person, status: 'on-leave' } : person));
}

// Reporting manager from the live directory (approvals route requests here)
export const managerOf = (userId: string): string | undefined => getOrgPeople().find((person) => person.id === userId)?.managerId;

// Anyone with at least one direct report, whatever their role (a senior developer leading two juniors counts)
export const managesAnyone = (userId: string): boolean => getOrgPeople().some((person) => person.managerId === userId);

// People at the top of the chart (no manager)
export const topLevel = (people: OrgPerson[]) => people.filter((person) => !person.managerId);

export const directReports = (people: OrgPerson[], managerId: string) =>
  people.filter((person) => person.managerId === managerId).sort((a, b) => a.name.localeCompare(b.name));

// Everyone below a person, however many levels down
export function teamSize(people: OrgPerson[], managerId: string): number {
  return directReports(people, managerId).reduce((total, person) => total + 1 + teamSize(people, person.id), 0);
}

// The reporting chain from the top of the company down to this person
export function chainTo(people: OrgPerson[], personId: string): OrgPerson[] {
  const chain: OrgPerson[] = [];
  let current = people.find((person) => person.id === personId);
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    chain.unshift(current);
    current = current.managerId ? people.find((person) => person.id === current!.managerId) : undefined;
  }
  return chain;
}

export interface OrgDepartment extends DepartmentInfo {
  people: OrgPerson[];
  // The most senior person in the department: the one whose manager sits outside it
  head?: OrgPerson;
}

export function getDepartments(people: OrgPerson[]): OrgDepartment[] {
  const known = DEPARTMENTS.map((info) => info.name);
  // Departments that appear in the directory but aren't configured still show up
  const extra = [...new Set(people.map((person) => person.department))]
    .filter((name) => !known.includes(name))
    .map((name): DepartmentInfo => ({ name, email: '', tone: 'gray', about: '' }));
  return [...DEPARTMENTS, ...extra]
    .map((info) => {
      const members = people.filter((person) => person.department === info.name).sort((a, b) => a.name.localeCompare(b.name));
      const head = members.find((person) => !person.managerId || !members.some((member) => member.id === person.managerId));
      return { ...info, people: head ? [head, ...members.filter((person) => person.id !== head.id)] : members, head };
    })
    .filter((department) => department.people.length > 0);
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
