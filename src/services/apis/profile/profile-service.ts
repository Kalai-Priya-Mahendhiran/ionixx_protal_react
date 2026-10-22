import { getOrgPeople } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { ProfileFormData } from '@/lib/schemas';
import { getPayrollData } from '@/lib/sample-data/payroll-sample-data';
import { sampleProfileFormData } from '@/lib/sample-data/profile-sample-data';
import { getUserById, updateDirectoryUser } from '@/lib/user-directory';
import { auditService } from '../audit/audit-service';

/*
 * Each person's own profile. In-memory mock (lasts until refresh). GET/PUT /api/profile/me.
 * A profile someone hasn't saved yet starts from the directory (name, work email, ID, birthday, phone,
 * location) and their pay record (PAN, bank). Saving writes name, birthday, phone and location back to the
 * directory, so the org chart, people directory, HR records and birthday wishes all follow.
 */

const MOCK_LATENCY_MS = 200;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

const profiles = new Map<string, ProfileFormData>();

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '');

function initialProfile(userId: string): ProfileFormData {
  const user = getUserById(userId);
  const person = getOrgPeople().find((entry) => entry.id === userId);
  const pay = getPayrollData(userId).profile;
  const [firstName = '', ...rest] = (user?.name ?? '').split(' ');
  const lastName = rest.join(' ');
  const [bankName] = pay.bankAccount.split(' ••••');
  return {
    // Education, past employment and consent start from the sample template; the person edits them
    ...structuredCopy(sampleProfileFormData),
    employeeId: person?.employeeId ?? userId,
    firstName,
    middleName: '',
    lastName,
    preferredName: '',
    dateOfBirth: user?.birthDate ?? sampleProfileFormData.dateOfBirth,
    personalEmail: `${slug(firstName)}.${slug(lastName) || 'home'}@email.com`,
    workEmail: user?.email ?? '',
    mobilePersonal: person?.phone ?? '',
    currentLocation: person?.location ?? pay.location,
    currentAddress: `${pay.location}, India`,
    emergencyContact: { ...sampleProfileFormData.emergencyContact, name: `${lastName || firstName} family`, phone: person?.phone ?? sampleProfileFormData.emergencyContact.phone },
    governmentIds: { ...sampleProfileFormData.governmentIds, pan: pay.pan },
    linkedinUrl: `https://linkedin.com/in/${slug(firstName)}${slug(lastName)}`,
    githubUrl: '',
    bankName: bankName || sampleProfileFormData.bankName,
  };
}

// JSON copy: the template has only plain data (strings, booleans, arrays of plain objects)
function structuredCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const profileService = {
  // GET /api/profile/me
  async get(actor: PermissionUser): Promise<ProfileFormData> {
    await delay();
    return structuredCopy(profiles.get(actor.id) ?? initialProfile(actor.id));
  },

  // PUT /api/profile/me
  async save(actor: PermissionUser, data: ProfileFormData): Promise<ProfileFormData> {
    await delay();
    const saved = structuredCopy(data);
    profiles.set(actor.id, saved);
    const name = [data.firstName, data.middleName, data.lastName].map((part) => part?.trim()).filter(Boolean).join(' ');
    updateDirectoryUser(actor.id, {
      ...(name ? { name } : {}),
      birthDate: data.dateOfBirth || undefined,
      phone: data.mobilePersonal?.trim() || undefined,
      location: data.currentLocation?.trim() || undefined,
    });
    auditService.record({ actorId: actor.id, entity: 'user', entityKey: name || actor.id, action: 'updated', summary: 'Updated their profile' });
    return saved;
  },
};
