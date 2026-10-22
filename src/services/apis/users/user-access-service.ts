import { MOCK_USERS, ROLE_LABELS, type UserRole } from '@/lib/mock-users';
import { CORE_MODULES, RESTRICTED_MODULES, getModuleLabel, roleHasModule } from '@/lib/modules';
import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { getAccessRecord, isUserActive, setAccessRecord } from '@/lib/user-access-store';
import { USER_DIRECTORY, addDirectoryUser, getUserById, updateDirectoryUser } from '@/lib/user-directory';
import type { AccessRecord, Project, UserAccount } from '@/types';
import { auditService } from '../audit/audit-service';
import { countOpenRequestsAssignedTo, releaseRequestsAssignedTo } from '../service-desk/request-service';
import { taskService } from '../tasks/task-service';

/*
 * User Management: accounts, roles, page (module) access and project access. In-memory mock (resets on refresh).
 * Endpoints: GET /api/users, POST /api/users/invite, PATCH /api/users/:id { status, role },
 * PUT /api/users/:id/modules, PUT /api/users/:id/projects, POST /api/users/:id/reset-password.
 * The backend must require user.manage for all of these, refuse sign-in for deactivated accounts,
 * and apply role and access changes on the person's next request.
 */

export interface InviteInput {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  managerId?: string;
}

export interface OpenWork {
  tasks: number;
  requests: number;
}

export class UserAccessError extends Error {}

const MOCK_LATENCY_MS = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const now = () => new Date().toISOString();
const nameOf = (id: string) => getUserById(id)?.name ?? id;

function assertCanManage(actor: PermissionUser) {
  if (!can(actor, 'user.manage')) throw new UserAccessError("You don't have permission to manage users");
}

function findPerson(id: string) {
  const person = getUserById(id);
  if (!person) throw new UserAccessError('That user no longer exists');
  return person;
}

const record = (actorId: string, userId: string, action: string, summary: string) =>
  auditService.record({ actorId, entity: 'user', entityKey: nameOf(userId), action, summary });

function updateAccess(userId: string, changes: Partial<AccessRecord>) {
  setAccessRecord(userId, { ...getAccessRecord(userId), ...changes });
}

const activeSystemAdmins = () => USER_DIRECTORY.filter((person) => person.role === 'system_admin' && isUserActive(person.id));

// Someone must always be able to manage users
function assertKeepsASystemAdmin(userId: string) {
  const person = getUserById(userId);
  if (person?.role === 'system_admin' && isUserActive(userId) && activeSystemAdmins().length <= 1) {
    throw new UserAccessError('This is the only active System Admin. Make someone else a System Admin first.');
  }
}

const toAccount = (personId: string): UserAccount => ({
  ...findPerson(personId),
  ...getAccessRecord(personId),
  hasLogin: MOCK_USERS.some((user) => user.id === personId),
});

/*
 * The people changes themselves, shared by User Management (System Admin) and HR Employee Management.
 * Callers check permission first; these only validate and apply, so both screens behave the same.
 */
export const peopleAdmin = {
  // Adds the person to the directory with an invited account; returns their id
  create(actorId: string, input: InviteInput): string {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name) throw new UserAccessError('Enter their full name');
    if (!EMAIL_PATTERN.test(email)) throw new UserAccessError('Enter a valid work email');
    if (USER_DIRECTORY.some((person) => person.email.toLowerCase() === email)) throw new UserAccessError(`${email} already has an account`);
    if (!ROLES.includes(input.role)) throw new UserAccessError('Choose a role');
    if (input.managerId && !isUserActive(input.managerId)) throw new UserAccessError('Choose an active reporting manager');

    const highest = USER_DIRECTORY.reduce((max, person) => Math.max(max, /^USR\d+$/.test(person.id) ? Number(person.id.slice(3)) : 0), 100);
    const id = `USR${highest + 1}`;
    addDirectoryUser({ id, name, email, role: input.role, department: input.department.trim() || 'Unassigned', designation: input.designation.trim() || ROLE_LABELS[input.role], managerId: input.managerId || undefined });
    setAccessRecord(id, { status: 'invited', grantedModules: [], revokedModules: [], invitedAt: now() });
    record(actorId, id, 'created', `Invited ${email} as ${ROLE_LABELS[input.role]}`);
    return id;
  },

  assertCanDeactivate(actorId: string, userId: string) {
    findPerson(userId);
    if (userId === actorId) throw new UserAccessError("You can't deactivate your own account");
    if (getAccessRecord(userId).status === 'deactivated') throw new UserAccessError(`${nameOf(userId)} is already deactivated`);
    assertKeepsASystemAdmin(userId);
  },

  // Blocks sign-in and returns their service-desk requests to the queue; returns the released request keys
  deactivate(actorId: string, userId: string): string[] {
    updateAccess(userId, { status: 'deactivated', deactivatedAt: now() });
    return releaseRequestsAssignedTo(userId, actorId);
  },

  activate(actorId: string, userId: string) {
    findPerson(userId);
    const previous = getAccessRecord(userId).status;
    if (previous === 'active') return;
    updateAccess(userId, { status: 'active', deactivatedAt: undefined });
    record(actorId, userId, 'activated', previous === 'invited' ? 'Activated the invited account' : 'Reactivated');
  },

  record: (actorId: string, userId: string, action: string, summary: string) => record(actorId, userId, action, summary),
};

export const userAccessService = {
  // GET /api/users
  async list(actor: PermissionUser): Promise<UserAccount[]> {
    await delay();
    assertCanManage(actor);
    return USER_DIRECTORY.map((person) => toAccount(person.id)).sort((a, b) => a.name.localeCompare(b.name));
  },

  // POST /api/users/invite — the account stays "invited" until the person first signs in
  async invite(actor: PermissionUser, input: InviteInput): Promise<UserAccount> {
    await delay();
    assertCanManage(actor);
    return toAccount(peopleAdmin.create(actor.id, input));
  },

  // What a person still has open, shown before deactivating them
  async getOpenWork(actor: PermissionUser, userId: string): Promise<OpenWork> {
    assertCanManage(actor);
    const tasks = (await taskService.list(actor)).filter((task) => task.assigneeId === userId && task.status !== 'done');
    return { tasks: tasks.length, requests: countOpenRequestsAssignedTo(userId) };
  },

  // PATCH /api/users/:id { status: 'deactivated' } — optionally hands their open tasks to someone else
  async deactivate(actor: PermissionUser, userId: string, reassignToId?: string): Promise<{ reassigned: string[]; skipped: number; releasedRequests: string[] }> {
    await delay();
    assertCanManage(actor);
    peopleAdmin.assertCanDeactivate(actor.id, userId);
    if (reassignToId && (reassignToId === userId || !isUserActive(reassignToId))) throw new UserAccessError('Choose an active person to take over their work');

    // Hand work over first, while the bulk update can still see the current assignee
    let reassigned: string[] = [];
    let skipped = 0;
    if (reassignToId) {
      const open = (await taskService.list(actor)).filter((task) => task.assigneeId === userId && task.status !== 'done');
      if (open.length) {
        const result = await taskService.bulkUpdate(actor, open.map((task) => task.id), { kind: 'assign', assigneeId: reassignToId });
        reassigned = result.updated;
        skipped = result.skipped.length;
      }
    }
    const releasedRequests = peopleAdmin.deactivate(actor.id, userId);
    record(
      actor.id,
      userId,
      'deactivated',
      `Deactivated${reassigned.length ? `; ${reassigned.length} open ${reassigned.length === 1 ? 'task' : 'tasks'} reassigned to ${nameOf(reassignToId!)}` : ''}${releasedRequests.length ? `; ${releasedRequests.length} ${releasedRequests.length === 1 ? 'request' : 'requests'} returned to the queue` : ''}`,
    );
    return { reassigned, skipped, releasedRequests };
  },

  // PATCH /api/users/:id { status: 'active' } — reactivate, or activate an invite without waiting for first sign-in
  async activate(actor: PermissionUser, userId: string): Promise<UserAccount> {
    await delay();
    assertCanManage(actor);
    peopleAdmin.activate(actor.id, userId);
    return toAccount(userId);
  },

  // PATCH /api/users/:id { role } — takes effect at their next sign-in
  async setRole(actor: PermissionUser, userId: string, role: UserRole): Promise<UserAccount> {
    await delay();
    assertCanManage(actor);
    const person = findPerson(userId);
    if (!ROLES.includes(role)) throw new UserAccessError('Choose a role');
    if (person.role === role) return toAccount(userId);
    if (person.role === 'system_admin') assertKeepsASystemAdmin(userId);

    const from = person.role;
    updateDirectoryUser(userId, { role });
    const login = MOCK_USERS.find((user) => user.id === userId);
    if (login) login.role = role;
    // Overrides that the new role already covers (or never had) are no longer overrides
    const access = getAccessRecord(userId);
    updateAccess(userId, {
      grantedModules: access.grantedModules.filter((path) => !roleHasModule(role, path)),
      revokedModules: access.revokedModules.filter((path) => roleHasModule(role, path)),
    });
    record(actor.id, userId, 'role-changed', `Role: ${ROLE_LABELS[from]} → ${ROLE_LABELS[role]}`);
    return toAccount(userId);
  },

  // PUT /api/users/:id/modules — give or take away one page compared with their role
  async setModuleAccess(actor: PermissionUser, userId: string, path: string, allowed: boolean): Promise<UserAccount> {
    await delay();
    assertCanManage(actor);
    const person = findPerson(userId);
    if (CORE_MODULES.includes(path)) throw new UserAccessError(`Everyone keeps ${getModuleLabel(path)}`);
    if (allowed && RESTRICTED_MODULES.includes(path) && !roleHasModule(person.role, path)) {
      throw new UserAccessError(`${getModuleLabel(path)} stays with the System Admin role; change their role instead`);
    }
    if (userId === actor.id && !allowed && RESTRICTED_MODULES.includes(path)) throw new UserAccessError("You can't remove your own access to system pages");

    const access = getAccessRecord(userId);
    const byRole = roleHasModule(person.role, path);
    updateAccess(userId, {
      grantedModules: allowed && !byRole ? [...new Set([...access.grantedModules, path])] : access.grantedModules.filter((item) => item !== path),
      revokedModules: !allowed && byRole ? [...new Set([...access.revokedModules, path])] : access.revokedModules.filter((item) => item !== path),
    });
    record(actor.id, userId, 'access-changed', `${allowed ? 'Gave access to' : 'Removed access to'} ${getModuleLabel(path)}`);
    return toAccount(userId);
  },

  // PUT /api/users/:id/projects — add to or remove from one project (the lead can't be removed)
  async setProjectMembership(actor: PermissionUser, userId: string, project: Project, member: boolean): Promise<Project> {
    assertCanManage(actor);
    findPerson(userId);
    if (!member && project.leadId === userId) throw new UserAccessError(`${nameOf(userId)} leads ${project.name}. Choose a new lead in Projects first.`);
    if (member && !isUserActive(userId)) throw new UserAccessError("Deactivated accounts can't join projects");
    const memberIds = member ? [...new Set([...project.memberIds, userId])] : project.memberIds.filter((id) => id !== userId);
    const { name, description, leadId, defaultIssueType } = project;
    return taskService.updateProject(actor, project.id, { name, description, leadId, memberIds, defaultIssueType });
  },

  // POST /api/users/:id/reset-password — the backend emails a one-time link
  async resetPassword(actor: PermissionUser, userId: string): Promise<string> {
    await delay();
    assertCanManage(actor);
    const person = findPerson(userId);
    if (getAccessRecord(userId).status === 'deactivated') throw new UserAccessError('Reactivate the account before resetting its password');
    record(actor.id, userId, 'password-reset', 'Sent a password reset link');
    return person.email;
  },
};
