import { directReports, getOrgPeople, teamBelow } from '@/lib/org-chart';
import { isUserActive, resetAccessRecords } from '@/lib/user-access-store';
import { getUserById } from '@/lib/user-directory';
import { userAccessService } from '../users/user-access-service';
import { employeeService } from './employee-service';

const hr = { id: 'HR001', role: 'hr' as const };
const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
const manager = { id: 'PM001', role: 'project_manager' as const };

describe('employee records (HR)', () => {
  afterEach(() => resetAccessRecords());

  it('lists everyone in the shared directory, including people who have left', async () => {
    const records = await employeeService.list(hr);
    expect(records.find((record) => record.id === 'EMP001')).toMatchObject({ name: 'Kalai Priya', reportingManager: 'Priya Kumar', employmentType: 'Full-time' });
    expect(records.find((record) => record.id === 'EMP008')?.status).toBe('inactive');
  });

  it('adds a new employee to the directory, org chart and User Management', async () => {
    const id = await employeeService.add(hr, { name: 'Nila Ravi', email: 'nila.ravi@example.com', designation: 'QA Intern', department: 'Quality', employeeId: 'EMP00199', managerId: 'PM001', employmentType: 'Intern', location: 'Chennai, IN' });
    expect(getUserById(id)).toMatchObject({ name: 'Nila Ravi', department: 'Quality', managerId: 'PM001' });
    expect(directReports(getOrgPeople(), 'PM001').some((person) => person.id === id)).toBe(true);
    expect((await userAccessService.list(sysAdmin)).find((account) => account.id === id)?.status).toBe('invited');
    expect((await employeeService.list(hr)).find((record) => record.id === id)).toMatchObject({ employeeId: 'EMP00199', employmentType: 'Intern', accountStatus: 'invited' });
  });

  it('refuses a duplicate employee ID', async () => {
    await expect(employeeService.add(hr, { name: 'Copy', email: 'copy@example.com', designation: 'Dev', department: 'Engineering', employeeId: 'EMP00101', employmentType: 'Full-time' })).rejects.toThrow('already in use');
  });

  it('switches off access when someone is marked inactive, and back on when reactivated', async () => {
    await employeeService.setActive(hr, 'EMP006', false);
    expect(isUserActive('EMP006')).toBe(false);
    expect(teamBelow(getOrgPeople(), 'PM001').some((person) => person.id === 'EMP006')).toBe(false);
    await employeeService.setActive(hr, 'EMP006', true);
    expect(isUserActive('EMP006')).toBe(true);
  });

  it('is only for HR and System Admin', async () => {
    await expect(employeeService.list(manager)).rejects.toThrow('permission');
  });
});
