import type { StatTone } from '@/components/ui/stat-card';

/*
 * Organization chart sample data. People come from the shared user directory (src/lib/user-directory.ts);
 * this file only adds what the org chart needs on top of it.
 */

// Leadership reporting lines, used by the org chart only (Tasks and team views keep the directory's own managerIds)
export const ORG_REPORTING_LINES: Record<string, string> = {
  PM001: 'EXE001',
  HR001: 'EXE001',
  ADM001: 'EXE001',
  SYS001: 'EXE001',
};

export interface DepartmentInfo {
  name: string;
  email: string;
  tone: StatTone;
  // Short line shown on the department card
  about: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  { name: 'Executive Office', email: 'leadership@company.com', tone: 'purple', about: 'Company leadership and strategy' },
  { name: 'Engineering', email: 'engineering@company.com', tone: 'indigo', about: 'Product development and delivery' },
  { name: 'Quality', email: 'quality@company.com', tone: 'teal', about: 'Testing and release quality' },
  { name: 'Design', email: 'design@company.com', tone: 'pink', about: 'Product and UX design' },
  { name: 'Infrastructure', email: 'infra@company.com', tone: 'sky', about: 'Cloud, CI/CD and environments' },
  { name: 'Human Resources', email: 'hr@company.com', tone: 'amber', about: 'People, hiring and policies' },
  { name: 'Operations', email: 'operations@company.com', tone: 'orange', about: 'Office, assets and facilities' },
  { name: 'IT', email: 'it@company.com', tone: 'blue', about: 'Systems, access and security' },
];

// 'invited': added in User Management but hasn't signed in yet
// 'not-in' = a working day with no check-in yet (or at all); the live value comes from attendance
export type WorkStatus = 'in-office' | 'remote' | 'on-leave' | 'not-in' | 'invited';

// Contact details for people the team roster doesn't cover (leadership logins, office staff)
export const PERSON_DETAILS: Record<string, { employeeId: string; phone: string; location: string; joiningDate: string; status: WorkStatus }> = {
  EXE001: { employeeId: 'EXE00106', phone: '+91 98765 10006', location: 'Mumbai, IN', joiningDate: '2016-06-01', status: 'in-office' },
  PM001: { employeeId: 'PM00103', phone: '+91 98765 10003', location: 'Bengaluru, IN', joiningDate: '2018-01-15', status: 'in-office' },
  HR001: { employeeId: 'HR00102', phone: '+91 98765 10002', location: 'Chennai, IN', joiningDate: '2019-03-04', status: 'in-office' },
  ADM001: { employeeId: 'ADM00104', phone: '+91 98765 10004', location: 'Mumbai, IN', joiningDate: '2025-08-01', status: 'in-office' },
  SYS001: { employeeId: 'SYS00105', phone: '+91 98765 10005', location: 'Hyderabad, IN', joiningDate: '2021-05-10', status: 'remote' },
  ADM002: { employeeId: 'ADM00201', phone: '+91 98765 10021', location: 'Mumbai, IN', joiningDate: '2024-02-12', status: 'in-office' },
  ADM003: { employeeId: 'ADM00202', phone: '+91 98765 10022', location: 'Mumbai, IN', joiningDate: '2025-01-06', status: 'on-leave' },
};
