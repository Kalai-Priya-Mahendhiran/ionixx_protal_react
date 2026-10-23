import { getOrgPeople } from '@/lib/org-chart';
import { getUserById } from '@/lib/user-directory';
import { profileService } from './profile-service';

const employee = { id: 'EMP001', role: 'employee' as const };
const hr = { id: 'HR001', role: 'hr' as const };

describe('profile', () => {
  it("opens with the person's own details, not a placeholder", async () => {
    const mine = await profileService.get(employee);
    expect(mine).toMatchObject({ firstName: 'Kalai', lastName: 'Priya', employeeId: 'EMP00101', workEmail: getUserById('EMP001')!.email });
    expect(mine.governmentIds.pan).toBe('ABCPK1234F');
    const theirs = await profileService.get(hr);
    expect(theirs).toMatchObject({ firstName: 'Priya', lastName: 'Ramesh' });
  });

  it('writes name, birthday, phone and location back to the directory and org chart', async () => {
    const mine = await profileService.get(employee);
    await profileService.save(employee, { ...mine, lastName: 'Priya M', dateOfBirth: '1998-02-14', mobilePersonal: '+91 90000 11111', currentLocation: 'Coimbatore, IN' });
    expect(getUserById('EMP001')).toMatchObject({ name: 'Kalai Priya M', birthDate: '1998-02-14' });
    expect(getOrgPeople().find((person) => person.id === 'EMP001')).toMatchObject({ name: 'Kalai Priya M', phone: '+91 90000 11111', location: 'Coimbatore, IN' });
    // And reading again returns what was saved
    expect((await profileService.get(employee)).currentLocation).toBe('Coimbatore, IN');
  });
});

describe('personal details per person', () => {
  it('gives each person their own gender, marital status and blood group instead of template defaults', async () => {
    const kalai = await profileService.get({ id: 'EMP001', role: 'employee' });
    const arjun = await profileService.get({ id: 'EMP002', role: 'employee' });
    const priyaRamesh = await profileService.get({ id: 'HR001', role: 'hr' });
    expect(kalai).toMatchObject({ gender: 'Female', maritalStatus: 'Single', bloodGroup: 'B+' });
    expect(arjun).toMatchObject({ gender: 'Male', maritalStatus: 'Married', bloodGroup: 'O+' });
    expect(priyaRamesh).toMatchObject({ gender: 'Female', maritalStatus: 'Married', bloodGroup: 'A+' });
    // Next of kin follows marital status, and nobody shares the template's passport number
    expect(kalai.emergencyContact.relationship).toBe('Parent');
    expect(arjun.emergencyContact.relationship).toBe('Spouse');
    expect(kalai.governmentIds.passportNumber).toBe('');
  });

  it('leaves the details blank for someone without them on record', async () => {
    const unknown = await profileService.get({ id: 'NEW999', role: 'employee' });
    expect(unknown.gender).toBe('Prefer not to say');
    expect(unknown.maritalStatus).toBeUndefined();
    expect(unknown.bloodGroup).toBeUndefined();
  });
});
