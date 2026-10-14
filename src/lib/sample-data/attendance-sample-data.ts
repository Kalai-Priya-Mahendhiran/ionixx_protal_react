import type { Attendance } from '@/types';

export const sampleAttendance: Attendance[] = [
  {
    id: '1',
    userId: '1',
    date: '2024-01-15',
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    hoursWorked: 8,
  },
  {
    id: '2',
    userId: '1',
    date: '2024-01-16',
    checkIn: '09:15',
    checkOut: '18:30',
    status: 'late',
    hoursWorked: 8.25,
  },
  {
    id: '3',
    userId: '1',
    date: '2024-01-17',
    checkIn: '09:00',
    checkOut: '17:30',
    status: 'present',
    hoursWorked: 7.5,
  },
];
