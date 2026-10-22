import { ROUTES } from '@/lib/constants';
import { MOCK_USERS } from '@/lib/mock-users';
import { getSidebarItems, hasModuleAccess } from '@/lib/modules';
import { can, getAssignableUsers } from '@/lib/permissions/task-permissions';
import { getAccessRecord, isUserActive, resetAccessRecords } from '@/lib/user-access-store';
import { getUserById } from '@/lib/user-directory';
import { requestService } from '../service-desk/request-service';
import { taskService } from '../tasks/task-service';
import { userAccessService } from './user-access-service';

const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
const manager = { id: 'PM001', role: 'project_manager' as const };
const employee = { id: 'EMP001', role: 'employee' as const };

describe('page (module) access', () => {
  beforeEach(() => resetAccessRecords());

  it("follows the role's defaults", () => {
    expect(hasModuleAccess(employee, ROUTES.Tasks)).toBe(true);
    expect(hasModuleAccess(employee, ROUTES.TeamOverview)).toBe(false);
    expect(hasModuleAccess({ id: 'ADM001', role: 'admin' }, ROUTES.Tasks)).toBe(false);
    expect(hasModuleAccess(sysAdmin, ROUTES.UserManagement)).toBe(true);
  });

  it('adds granted pages to the menu and hides removed ones', async () => {
    // EMP002 has Reports on top of the employee pages in the sample data
    expect(getSidebarItems({ id: 'EMP002', role: 'employee' }).map((item) => item.path)).toContain(ROUTES.Reports);

    await userAccessService.setModuleAccess(sysAdmin, 'EMP001', ROUTES.Files, false);
    expect(hasModuleAccess(employee, ROUTES.Files)).toBe(false);
    expect(getSidebarItems(employee).map((item) => item.path)).not.toContain(ROUTES.Files);

    // Turning it back on removes the override rather than adding a grant
    await userAccessService.setModuleAccess(sysAdmin, 'EMP001', ROUTES.Files, true);
    expect(getAccessRecord('EMP001')).toMatchObject({ grantedModules: [], revokedModules: [] });
  });

  it('keeps core pages for everyone and system pages for System Admins', async () => {
    await expect(userAccessService.setModuleAccess(sysAdmin, 'EMP001', ROUTES.Dashboard, false)).rejects.toThrow('Everyone keeps');
    await expect(userAccessService.setModuleAccess(sysAdmin, 'EMP001', ROUTES.UserManagement, true)).rejects.toThrow('System Admin role');
    await expect(userAccessService.setModuleAccess(manager, 'EMP001', ROUTES.Reports, true)).rejects.toThrow('permission');
  });
});

describe('userAccessService', () => {
  beforeEach(() => resetAccessRecords());

  it('lists everyone with their access for System Admins only', async () => {
    const accounts = await userAccessService.list(sysAdmin);
    expect(accounts.find((account) => account.id === 'EMP008')).toMatchObject({ status: 'deactivated', hasLogin: false });
    expect(accounts.find((account) => account.id === 'SYS001')).toMatchObject({ status: 'active', hasLogin: true });
    await expect(userAccessService.list(manager)).rejects.toThrow('permission');
  });

  it('keeps deactivated people out of pickers and assignments', () => {
    expect(isUserActive('EMP008')).toBe(false);
    expect(getAssignableUsers(sysAdmin).some((person) => person.id === 'EMP008')).toBe(false);
    expect(can(sysAdmin, 'task.assign', { assigneeId: 'EMP008', reporterId: 'SYS001', type: 'task' })).toBe(false);
  });

  it('deactivates, hands open tasks over and returns open requests to the queue', async () => {
    const before = (await taskService.list(sysAdmin)).filter((task) => task.assigneeId === 'EMP006' && task.status !== 'done');
    expect(before.length).toBeGreaterThan(0);

    const result = await userAccessService.deactivate(sysAdmin, 'EMP006', 'EMP007');
    expect(result.reassigned).toHaveLength(before.length);
    expect(isUserActive('EMP006')).toBe(false);
    expect(hasModuleAccess({ id: 'EMP006', role: 'employee' }, ROUTES.Tasks)).toBe(false);
    expect((await taskService.list(sysAdmin)).filter((task) => task.assigneeId === 'EMP006' && task.status !== 'done')).toHaveLength(0);

    await userAccessService.activate(sysAdmin, 'EMP006');
    expect(isUserActive('EMP006')).toBe(true);
  });

  it('unassigns Admin team requests when a desk member is deactivated', async () => {
    const result = await userAccessService.deactivate(sysAdmin, 'ADM003');
    expect(result.releasedRequests.length).toBeGreaterThan(0);
    const desk = { id: 'ADM001', role: 'admin' as const };
    const released = (await requestService.list(desk)).filter((request) => result.releasedRequests.includes(request.key));
    expect(released.every((request) => !request.assigneeId)).toBe(true);
    await userAccessService.activate(sysAdmin, 'ADM003');
  });

  it('never leaves the portal without an active System Admin', async () => {
    await expect(userAccessService.deactivate(sysAdmin, 'SYS001')).rejects.toThrow('your own account');
    await expect(userAccessService.setRole(sysAdmin, 'SYS001', 'employee')).rejects.toThrow('only active System Admin');
  });

  it('changes roles for sign-in and drops overrides the new role makes redundant', async () => {
    // EMP002 has Reports granted; managers get Reports by default
    await userAccessService.setRole(sysAdmin, 'EMP002', 'project_manager');
    expect(getUserById('EMP002')?.role).toBe('project_manager');
    expect(getAccessRecord('EMP002').grantedModules).toEqual([]);
    await userAccessService.setRole(sysAdmin, 'EMP002', 'employee');

    await userAccessService.setRole(sysAdmin, 'EMP001', 'hr');
    expect(MOCK_USERS.find((user) => user.id === 'EMP001')?.role).toBe('hr');
    await userAccessService.setRole(sysAdmin, 'EMP001', 'employee');
  });

  it('invites new people as Invited, with a unique email', async () => {
    const account = await userAccessService.invite(sysAdmin, { name: 'Asha Pillai', email: 'Asha.Pillai@company.com', role: 'employee', department: 'Engineering', designation: 'QA Engineer', managerId: 'PM001' });
    expect(account).toMatchObject({ status: 'invited', email: 'asha.pillai@company.com', hasLogin: false });
    expect(isUserActive(account.id)).toBe(false);
    await expect(userAccessService.invite(sysAdmin, { name: 'Again', email: 'asha.pillai@company.com', role: 'employee', department: '', designation: '' })).rejects.toThrow('already has an account');
  });

  it('adds people to projects but never removes the lead', async () => {
    const [ixp] = (await taskService.listProjects()).filter((project) => project.key === 'IXP');
    const updated = await userAccessService.setProjectMembership(sysAdmin, 'HR001', ixp, true);
    expect(updated.memberIds).toContain('HR001');
    await expect(userAccessService.setProjectMembership(sysAdmin, ixp.leadId, updated, false)).rejects.toThrow('Choose a new lead');
    await expect(userAccessService.setProjectMembership(sysAdmin, 'EMP008', updated, true)).rejects.toThrow("can't join");
  });
});
