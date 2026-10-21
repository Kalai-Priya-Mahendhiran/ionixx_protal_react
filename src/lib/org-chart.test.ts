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
