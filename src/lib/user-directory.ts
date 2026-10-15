import { MOCK_USERS } from '@/lib/mock-users';
import { teamMembers } from '@/lib/team-data';
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
export const USER_DIRECTORY: TaskUser[] = [
  ...rosterUsers,
  ...loginUsers.filter((user) => !rosterUsers.some((member) => member.id === user.id)),
];

const usersById = new Map(USER_DIRECTORY.map((user) => [user.id, user]));

export function getUserById(id: string | undefined): TaskUser | undefined {
  return id ? usersById.get(id) : undefined;
}

// The manager plus everyone reporting to them
export function getTeamOf(managerId: string): TaskUser[] {
  return USER_DIRECTORY.filter((user) => user.id === managerId || user.managerId === managerId);
}
