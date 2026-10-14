import type { File } from '@/types';

export const sampleFiles: File[] = [
  {
    id: '1',
    name: 'Employee Handbook 2024.pdf',
    type: 'application/pdf',
    size: 2048576,
    uploadedBy: 'HR Team',
    uploadedDate: '2024-01-01',
    category: 'hr-policies',
    accessLevel: 'public',
    url: '/files/employee-handbook-2024.pdf',
  },
  {
    id: '2',
    name: 'Salary Slip - January 2024.pdf',
    type: 'application/pdf',
    size: 512000,
    uploadedBy: 'Payroll Team',
    uploadedDate: '2024-01-31',
    category: 'salary',
    accessLevel: 'private',
    url: '/files/salary-slip-jan-2024.pdf',
  },
];
