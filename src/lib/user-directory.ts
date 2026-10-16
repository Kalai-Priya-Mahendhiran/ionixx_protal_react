import { MOCK_USERS } from '@/lib/mock-users';
import { teamMembers } from '@/lib/team-data';
import { deskStaff } from '@/lib/sample-data/service-desk-sample-data';
import { formerStaff } from '@/lib/sample-data/user-access-sample-data';
import { isUserActive } from '@/lib/user-access-store';
import type { TaskUser } from '@/types';

// Login users plus the team roster, merged into one directory keyed by user ID.
// Replace with GET /api/users/directory once the backend exists.
const loginUsers: TaskUser[] = MOCK_USERS.map((user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  designation: user.designation,
  avatar: user.avatar,
}));

const findIdByName = (name: string) => loginUsers.find((user) => user.name === name)?.id;

const rosterUsers: TaskUser[] = teamMembers.map((member) => ({
  id: member.id,
  name: member.name,
  email: member.email,
  role: 'employee',
  department: member.department,
  designation: member.designation,
  managerId: findIdByName(member.reportingManager),
  joiningDate: member.joiningDate,
}));

// Roster entries win for people in both lists, since they carry the reporting manager
// Admin (office operations) team members without a demo login and former staff come last.
// Everyone stays listed so history still shows names; pickers use getActiveUsers().
export const USER_DIRECTORY: TaskUser[] = [
  ...rosterUsers,
  ...loginUsers.filter((user) => !rosterUsers.some((member) => member.id === user.id)),
  ...deskStaff,
  ...formerStaff,
];

const usersById = new Map(USER_DIRECTORY.map((user) => [user.id, user]));

export function getUserById(id: string | undefined): TaskUser | undefined {
  return id ? usersById.get(id) : undefined;
}

// People who can be picked: assigned work, added to projects, issued assets…
export function getActiveUsers(): TaskUser[] {
  return USER_DIRECTORY.filter((user) => isUserActive(user.id));
}

// The manager plus everyone (still active) reporting to them
export function getTeamOf(managerId: string): TaskUser[] {
  return getActiveUsers().filter((user) => user.id === managerId || user.managerId === managerId);
}

/* Used only by the user access service (User Management) */

export function addDirectoryUser(user: TaskUser): void {
  USER_DIRECTORY.push(user);
  usersById.set(user.id, user);
}

export function updateDirectoryUser(id: string, changes: Partial<Omit<TaskUser, 'id'>>): void {
  const user = usersById.get(id);
  if (user) Object.assign(user, changes);
}
