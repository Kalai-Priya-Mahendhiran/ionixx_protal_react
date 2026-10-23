import { ROUTES } from '@/lib/constants';
import { getSidebarItems, hasModuleAccess } from '@/lib/modules';
import { resolveTaskView } from '@/lib/permissions/task-permissions';

const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
const employee = { id: 'EMP001', role: 'employee' as const };
const executive = { id: 'EXE001', role: 'executive' as const };

describe('menu', () => {
  it("names match what they open: System Admin's My Requests is their own requests, Tasks opens the tasks", () => {
    const items = getSidebarItems(sysAdmin);
    expect(items.find((item) => item.id === 'my-requests')).toMatchObject({ path: ROUTES.ServiceDesk, search: 'tab=mine' });
    expect(items.find((item) => item.id === 'service-desk')).toMatchObject({ path: ROUTES.ServiceDesk });
    expect(items.find((item) => item.id === 'task-settings')).toMatchObject({ path: ROUTES.Tasks, search: 'view=settings' });
    expect(resolveTaskView(sysAdmin, null)).toBe('all-projects');
  });

  it('gives every role Attendance, Time Tracker and Leave Tracker', () => {
    for (const user of [sysAdmin, employee, executive]) {
      expect(hasModuleAccess(user, ROUTES.Attendance)).toBe(true);
      expect(hasModuleAccess(user, ROUTES.Leave)).toBe(true);
      expect(hasModuleAccess(user, ROUTES.TimeTracker)).toBe(true);
      expect(getSidebarItems(user).map((item) => item.path)).toEqual(expect.arrayContaining([ROUTES.Attendance, ROUTES.TimeTracker, ROUTES.Leave]));
    }
  });

  it('still keeps system pages from other roles', () => {
    expect(hasModuleAccess(employee, ROUTES.UserManagement)).toBe(false);
    expect(getSidebarItems(employee).some((item) => item.id === 'task-settings')).toBe(false);
  });
});
