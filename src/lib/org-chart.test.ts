import { userAccessService } from '@/services/apis/users/user-access-service';
import { resetAccessRecords } from './user-access-store';
import { chainTo, directReports, getDepartments, getOrgPeople, teamSize, topLevel } from './org-chart';

describe('org chart', () => {
  const people = getOrgPeople();

  it('puts the executive at the top and leadership under them', () => {
    expect(topLevel(people).map((person) => person.id)).toEqual(['EXE001']);
    expect(directReports(people, 'EXE001').map((person) => person.id).sort()).toEqual(['ADM001', 'HR001', 'PM001', 'SYS001']);
  });

  it('builds the reporting chain from the top down', () => {
    expect(chainTo(people, 'EMP001').map((person) => person.id)).toEqual(['EXE001', 'PM001', 'EMP001']);
  });

  it('counts the whole team below a manager', () => {
    // The manager's seven engineers
    expect(teamSize(people, 'PM001')).toBe(directReports(people, 'PM001').length);
    // Everyone except the executive
    expect(teamSize(people, 'EXE001')).toBe(people.length - 1);
  });

  it('leaves out former staff', () => {
    expect(people.some((person) => person.id === 'EMP008')).toBe(false);
  });

  it('lists each department with its head first', () => {
    const engineering = getDepartments(people).find((department) => department.name === 'Engineering')!;
    expect(engineering.head?.id).toBe('PM001');
    expect(engineering.people[0].id).toBe('PM001');
    const operations = getDepartments(people).find((department) => department.name === 'Operations')!;
    expect(operations.head?.id).toBe('ADM001');
  });

  it('only shows departments that have people', () => {
    expect(getDepartments(people).every((department) => department.people.length > 0)).toBe(true);
  });
});

describe('org chart updates as people are added and removed', () => {
  const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
  afterEach(() => resetAccessRecords());

  it('shows a newly invited team member under their manager', async () => {
    expect(directReports(getOrgPeople(), 'EMP001')).toHaveLength(0);
    const account = await userAccessService.invite(sysAdmin, { name: 'Anu Joseph', email: 'anu.joseph@example.com', role: 'employee', department: 'Engineering', designation: 'Intern', managerId: 'EMP001' });

    const after = getOrgPeople();
    expect(directReports(after, 'EMP001').map((person) => person.id)).toEqual([account.id]);
    expect(after.find((person) => person.id === account.id)?.status).toBe('invited');
    // Her manager's chain now has a level below her
    expect(chainTo(after, account.id).map((person) => person.id)).toEqual(['EXE001', 'PM001', 'EMP001', account.id]);
  });

  it('drops people who are deactivated', async () => {
    await userAccessService.deactivate(sysAdmin, 'EMP007');
    expect(getOrgPeople().some((person) => person.id === 'EMP007')).toBe(false);
  });
});
