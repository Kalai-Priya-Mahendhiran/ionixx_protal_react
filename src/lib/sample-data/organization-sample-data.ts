import type { User, Department } from '@/types';

export const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@ionixx.com',
    phone: '+1-555-0123',
    address: '123 Main St, City, State',
    department: 'Engineering',
    designation: 'Senior Developer',
    employeeId: 'EMP001',
    joiningDate: '2022-01-15',
    reportingManager: 'Jane Smith',
    role: 'employee',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0001234',
    accountType: 'Savings',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@ionixx.com',
    phone: '+1-555-0124',
    address: '456 Oak Ave, City, State',
    department: 'Engineering',
    designation: 'Engineering Manager',
    employeeId: 'EMP002',
    joiningDate: '2021-03-10',
    reportingManager: 'Mike Johnson',
    role: 'manager',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@ionixx.com',
    phone: '+1-555-0125',
    address: '789 Pine St, City, State',
    department: 'Engineering',
    designation: 'VP Engineering',
    employeeId: 'EMP003',
    joiningDate: '2020-06-01',
    reportingManager: 'CEO',
    role: 'admin',
  },
];

export const sampleDepartments: Department[] = [
  { id: 'all', name: 'All Departments', count: sampleUsers.length },
  { id: 'engineering', name: 'Engineering', count: sampleUsers.filter(u => u.department === 'Engineering').length },
  { id: 'hr', name: 'Human Resources', count: 0 },
  { id: 'marketing', name: 'Marketing', count: 0 },
  { id: 'sales', name: 'Sales', count: 0 },
];
