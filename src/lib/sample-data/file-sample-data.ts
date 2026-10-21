import type { File } from '@/types';

/*
 * Files sample data. Who sees a file depends on the signed-in person (see fileService.list):
 *  - company files (public) for everyone, or only for `roles` when set
 *  - department files for people in that department
 *  - private documents (offer letter, Form 16…) only for their `ownerId`
 */

const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

// Sample documents have no stored file; the Files page builds a preview for them
const sample = (id: string) => `sample://${id}`;

const company: File[] = [
  { id: 'co-handbook', name: 'Employee Handbook 2026.pdf', type: PDF, size: 2_048_576, uploadedBy: 'HR Team', uploadedDate: '2026-01-05', category: 'hr-policies', accessLevel: 'public', url: sample('co-handbook') },
  { id: 'co-leave', name: 'Leave Policy 2026.pdf', type: PDF, size: 612_000, uploadedBy: 'HR Team', uploadedDate: '2026-01-05', category: 'hr-policies', accessLevel: 'public', url: sample('co-leave') },
  { id: 'co-holidays', name: 'Holiday List 2026.pdf', type: PDF, size: 214_000, uploadedBy: 'HR Team', uploadedDate: '2025-12-20', category: 'general', accessLevel: 'public', url: sample('co-holidays') },
  { id: 'co-conduct', name: 'Code of Conduct.pdf', type: PDF, size: 880_000, uploadedBy: 'HR Team', uploadedDate: '2025-04-01', category: 'hr-policies', accessLevel: 'public', url: sample('co-conduct') },
  { id: 'co-security', name: 'Information Security Awareness.pptx', type: PPTX, size: 4_300_000, uploadedBy: 'IT Team', uploadedDate: '2026-03-12', category: 'training', accessLevel: 'public', url: sample('co-security') },
  { id: 'co-posh', name: 'POSH Training – 2026.pptx', type: PPTX, size: 3_150_000, uploadedBy: 'HR Team', uploadedDate: '2026-02-02', category: 'training', accessLevel: 'public', url: sample('co-posh') },
  { id: 'co-reimburse', name: 'Reimbursement Guidelines.pdf', type: PDF, size: 340_000, uploadedBy: 'Payroll Team', uploadedDate: '2026-04-02', category: 'salary', accessLevel: 'public', url: sample('co-reimburse') },
  // Role-limited company files
  { id: 'co-review-guide', name: 'Performance Review Guide – Managers.pdf', type: PDF, size: 720_000, uploadedBy: 'HR Team', uploadedDate: '2026-03-01', category: 'hr-policies', accessLevel: 'public', roles: ['project_manager', 'hr', 'executive'], url: sample('co-review-guide') },
  { id: 'co-salary-bands', name: 'Salary Bands FY 2026-27.xlsx', type: XLSX, size: 96_000, uploadedBy: 'HR Team', uploadedDate: '2026-04-01', category: 'salary', accessLevel: 'public', roles: ['hr', 'executive'], url: sample('co-salary-bands') },
  { id: 'co-admin-sop', name: 'System Access Request SOP.pdf', type: PDF, size: 410_000, uploadedBy: 'IT Team', uploadedDate: '2026-02-18', category: 'general', accessLevel: 'public', roles: ['system_admin', 'admin'], url: sample('co-admin-sop') },
];

const department: File[] = [
  { id: 'dep-eng-standards', name: 'Coding Standards.docx', type: DOCX, size: 260_000, uploadedBy: 'Priya Kumar', uploadedDate: '2026-05-14', category: 'department', accessLevel: 'department', department: 'Engineering', url: sample('dep-eng-standards') },
  { id: 'dep-eng-release', name: 'Release Checklist.xlsx', type: XLSX, size: 58_000, uploadedBy: 'Priya Kumar', uploadedDate: '2026-08-21', category: 'department', accessLevel: 'department', department: 'Engineering', url: sample('dep-eng-release') },
  { id: 'dep-hr-templates', name: 'Offer Letter Template.docx', type: DOCX, size: 120_000, uploadedBy: 'Priya Ramesh', uploadedDate: '2026-01-10', category: 'department', accessLevel: 'department', department: 'Human Resources', url: sample('dep-hr-templates') },
  { id: 'dep-hr-onboarding', name: 'Onboarding Checklist.xlsx', type: XLSX, size: 44_000, uploadedBy: 'Priya Ramesh', uploadedDate: '2026-06-03', category: 'department', accessLevel: 'department', department: 'Human Resources', url: sample('dep-hr-onboarding') },
  { id: 'dep-ops-vendors', name: 'Vendor Contacts.xlsx', type: XLSX, size: 38_000, uploadedBy: 'Vikram Shah', uploadedDate: '2026-07-08', category: 'department', accessLevel: 'department', department: 'Operations', url: sample('dep-ops-vendors') },
  { id: 'dep-ops-assets', name: 'Asset Handover Form.pdf', type: PDF, size: 150_000, uploadedBy: 'Vikram Shah', uploadedDate: '2026-03-22', category: 'department', accessLevel: 'department', department: 'Operations', url: sample('dep-ops-assets') },
  { id: 'dep-it-network', name: 'Network Diagram.pdf', type: PDF, size: 1_240_000, uploadedBy: 'kaviya Iyer', uploadedDate: '2026-04-28', category: 'department', accessLevel: 'department', department: 'IT', url: sample('dep-it-network') },
  { id: 'dep-it-backup', name: 'Backup and Restore Runbook.docx', type: DOCX, size: 310_000, uploadedBy: 'kaviya Iyer', uploadedDate: '2026-09-02', category: 'department', accessLevel: 'department', department: 'IT', url: sample('dep-it-backup') },
  { id: 'dep-exe-board', name: 'Board Update – Q2 FY27.pptx', type: PPTX, size: 5_600_000, uploadedBy: 'Ananya Nair', uploadedDate: '2026-07-15', category: 'department', accessLevel: 'department', department: 'Executive Office', url: sample('dep-exe-board') },
];

// Every person's own documents
const PEOPLE: { id: string; joined: string }[] = [
  { id: 'EMP001', joined: '2022-07-11' },
  { id: 'HR001', joined: '2019-03-04' },
  { id: 'PM001', joined: '2018-01-15' },
  { id: 'ADM001', joined: '2025-08-01' },
  { id: 'SYS001', joined: '2021-05-10' },
  { id: 'EXE001', joined: '2016-06-01' },
];

const personal: File[] = PEOPLE.flatMap(({ id, joined }) => [
  { id: `${id}-offer`, name: 'Offer Letter.pdf', type: PDF, size: 180_000, uploadedBy: 'HR Team', uploadedDate: joined, category: 'personal', accessLevel: 'private', ownerId: id, url: sample(`${id}-offer`) },
  { id: `${id}-id`, name: 'ID Proof (PAN card).pdf', type: PDF, size: 95_000, uploadedBy: 'HR Team', uploadedDate: joined, category: 'personal', accessLevel: 'private', ownerId: id, url: sample(`${id}-id`) },
  { id: `${id}-revision`, name: 'Salary Revision Letter – FY 2026-27.pdf', type: PDF, size: 140_000, uploadedBy: 'Payroll Team', uploadedDate: '2026-04-03', category: 'salary', accessLevel: 'private', ownerId: id, url: sample(`${id}-revision`) },
  { id: `${id}-form16`, name: 'Form 16 – FY 2025-26.pdf', type: PDF, size: 260_000, uploadedBy: 'Payroll Team', uploadedDate: '2026-06-14', category: 'salary', accessLevel: 'private', ownerId: id, url: sample(`${id}-form16`) },
]);

export const sampleFiles: File[] = [...company, ...department, ...personal];
