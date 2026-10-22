import type { EMPLOYMENT_TYPES } from '@/lib/form-schemas/hr';

/*
 * HR-only details kept alongside the shared user directory (name, role, department and manager live there).
 * Keyed by directory id; people without an entry get defaults, so anyone added later still works.
 */

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface EmployeeDocument {
  name: string;
  type: string;
  uploadedDate: string;
}

export interface HrDetails {
  employmentType: EmploymentType;
  documents: EmployeeDocument[];
}

export const sampleHrDetails: Record<string, HrDetails> = {
  EMP001: {
    employmentType: 'Full-time',
    documents: [
      { name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2023-03-20' },
      { name: 'PAN Card.pdf', type: 'ID', uploadedDate: '2023-04-12' },
    ],
  },
  EMP002: {
    employmentType: 'Full-time',
    documents: [
      { name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2021-06-10' },
      { name: 'Aadhaar.pdf', type: 'ID', uploadedDate: '2021-07-05' },
    ],
  },
  EMP003: { employmentType: 'Full-time', documents: [{ name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2022-10-18' }] },
  EMP004: { employmentType: 'Full-time', documents: [{ name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2022-12-15' }] },
  EMP005: {
    employmentType: 'Full-time',
    documents: [
      { name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2020-08-25' },
      { name: 'Background Verification.pdf', type: 'BGV', uploadedDate: '2020-09-30' },
    ],
  },
  EMP007: { employmentType: 'Full-time', documents: [{ name: 'Offer Letter.pdf', type: 'Offer', uploadedDate: '2024-01-30' }] },
  ADM003: { employmentType: 'Contract', documents: [] },
};
