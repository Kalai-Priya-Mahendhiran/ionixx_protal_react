import type { UserRole } from '@/lib/mock-users';
import { getOrgPeople } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleHrDetails, type EmployeeDocument, type EmploymentType, type HrDetails } from '@/lib/sample-data/hr-employee-sample-data';
import { PERSON_DETAILS } from '@/lib/sample-data/organization-sample-data';
import { teamMembers } from '@/lib/team-data';
import { getAccessRecord } from '@/lib/user-access-store';
import { USER_DIRECTORY, getUserById, updateDirectoryUser } from '@/lib/user-directory';
import { todayAsDateInput } from '@/lib/utils';
import { leaveService } from '../leave/leave-service';
import { UserAccessError, peopleAdmin } from '../users/user-access-service';

/*
 * HR Employee Management, on top of the shared user directory: adding someone here puts them in the
 * Org Chart, User Management (as an invited account) and every people picker; marking them inactive
 * deactivates their access. In-memory mock. Endpoints: GET/POST /api/employees, PATCH /api/employees/:id.
 */

export type EmploymentStatus = 'active' | 'on-leave' | 'inactive';

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  employeeId: string;
  managerId?: string;
  reportingManager: string;
  joiningDate: string;
  location: string;
  status: EmploymentStatus;
  // Invited people haven't signed in yet
  accountStatus: 'active' | 'invited' | 'deactivated';
  employmentType: EmploymentType;
  documents: EmployeeDocument[];
}

export interface AddEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  designation: string;
  department: string;
  employeeId: string;
  managerId?: string;
  joiningDate?: string;
  location?: string;
  employmentType: EmploymentType;
}

// HR and System Admin look after employee records
const HR_ROLES: UserRole[] = ['hr', 'system_admin'];

const MOCK_LATENCY_MS = 150;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// Details HR enters that the directory doesn't hold; anyone missing gets defaults
let hrDetails: Record<string, HrDetails & { employeeId?: string; phone?: string; location?: string; joiningDate?: string }> = Object.fromEntries(Object.entries(sampleHrDetails).map(([id, details]) => [id, { ...details, documents: [...details.documents] }]));

function assertHr(actor: PermissionUser) {
  if (!HR_ROLES.includes(actor.role)) throw new UserAccessError("You don't have permission to manage employee records");
}

const today = () => todayAsDateInput();

export const employeeService = {
  // GET /api/employees — everyone in the directory, including people who have left
  async list(actor: PermissionUser): Promise<EmployeeRecord[]> {
    await delay();
    assertHr(actor);
    const org = new Map(getOrgPeople().map((person) => [person.id, person]));
    const absences = await leaveService.listAbsences();
    const onLeaveToday = new Set(absences.filter((absence) => absence.startDate <= today() && today() <= absence.endDate).map((absence) => absence.userId));

    return USER_DIRECTORY.map((user): EmployeeRecord => {
      const person = org.get(user.id);
      const roster = teamMembers.find((member) => member.id === user.id);
      const extra = PERSON_DETAILS[user.id];
      const hr = hrDetails[user.id];
      const accountStatus = getAccessRecord(user.id).status;
      const managerId = person?.managerId ?? user.managerId;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: hr?.phone ?? person?.phone ?? '',
        designation: user.designation,
        department: user.department,
        employeeId: hr?.employeeId ?? person?.employeeId ?? roster?.employeeId ?? extra?.employeeId ?? user.id,
        managerId,
        reportingManager: managerId ? (getUserById(managerId)?.name ?? '—') : '—',
        joiningDate: hr?.joiningDate ?? person?.joiningDate ?? user.joiningDate ?? '',
        location: hr?.location ?? person?.location ?? '',
        status: accountStatus === 'deactivated' ? 'inactive' : onLeaveToday.has(user.id) || person?.status === 'on-leave' ? 'on-leave' : 'active',
        accountStatus,
        employmentType: hr?.employmentType ?? 'Full-time',
        documents: hr?.documents ?? [],
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  },

  // POST /api/employees — creates the directory person (invited) plus their HR details
  async add(actor: PermissionUser, input: AddEmployeeInput): Promise<string> {
    await delay();
    assertHr(actor);
    const employeeId = input.employeeId.trim();
    const taken = USER_DIRECTORY.some((user) => (hrDetails[user.id]?.employeeId ?? PERSON_DETAILS[user.id]?.employeeId ?? teamMembers.find((member) => member.id === user.id)?.employeeId) === employeeId);
    if (taken) throw new UserAccessError(`Employee ID ${employeeId} is already in use`);
    const id = peopleAdmin.create(actor.id, { name: input.name, email: input.email, role: 'employee', department: input.department, designation: input.designation, managerId: input.managerId });
    const joiningDate = input.joiningDate || today();
    updateDirectoryUser(id, { joiningDate });
    hrDetails = {
      ...hrDetails,
      [id]: { employmentType: input.employmentType, documents: [], employeeId, phone: input.phone?.trim(), location: input.location?.trim(), joiningDate },
    };
    return id;
  },

  // PATCH /api/employees/:id { active } — leaving the company deactivates their access too
  async setActive(actor: PermissionUser, userId: string, active: boolean): Promise<void> {
    await delay();
    assertHr(actor);
    if (active) {
      peopleAdmin.activate(actor.id, userId);
      return;
    }
    peopleAdmin.assertCanDeactivate(actor.id, userId);
    peopleAdmin.deactivate(actor.id, userId);
    peopleAdmin.record(actor.id, userId, 'deactivated', 'Marked inactive in Employee Management');
  },
};
