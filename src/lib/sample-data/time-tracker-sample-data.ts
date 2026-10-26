import type { TimeEntry } from '@/types';
import type { TaskRecord } from '@/components/common-component/time-tracker/sections/task-form';
import { toDateInput } from '@/lib/utils';

// Task dates are relative to today so the default "last 7 days" view always has work in it
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInput(date);
};

// Kalai's time this week and last; dates are relative to today so the weekly views always have data
const entry = (id: string, back: number, project: string, module: string, task: string, startTime: string, endTime: string, totalHours: number, description: string, status: TimeEntry['status'] = 'approved'): TimeEntry => ({
  id, userId: 'EMP001', project, module, task, date: daysAgo(back), startTime, endTime, description, totalHours, status,
});

export const sampleTimeEntries: TimeEntry[] = [
  entry('te-1', 1, 'Employee Portal', 'Dashboard', 'Coding', '09:30', '13:00', 3.5, 'Dashboard quick stats from live data', 'submitted'),
  entry('te-2', 1, 'Employee Portal', 'Authentication', 'Code Review', '14:00', '16:00', 2, 'Reviewed the session refresh changes', 'submitted'),
  entry('te-3', 2, 'People Operations', 'Reporting', 'Analysis', '10:00', '12:30', 2.5, 'Leave report requirements with HR'),
  entry('te-4', 2, 'Employee Portal', 'Time Tracking', 'Bug Fix', '13:30', '17:30', 4, 'Fixed timer rounding on long sessions'),
  entry('te-5', 3, 'Internal (meetings, admin)', 'General', 'Daily Meeting', '09:30', '10:00', 0.5, 'Stand-up'),
  entry('te-6', 3, 'Employee Portal', 'Dashboard', 'Coding', '10:00', '17:00', 7, 'Celebrations and upcoming events cards'),
  entry('te-7', 6, 'Employee Portal', 'Authentication', 'Coding', '09:15', '17:30', 8.25, 'Integrating authentication APIs'),
];

// Time that isn't for a project; always offered next to the Tasks module's projects
export const NON_PROJECT_TIME = 'Internal (meetings, admin)';
// Used only until the Tasks projects have loaded
export const PROJECTS = ['Employee Portal', 'People Operations', NON_PROJECT_TIME];

// 10 Oct is over the 8h daily limit, so its tasks show as overrunning
export const sampleTodaysTasks: TaskRecord[] = [
  {
    id: 'task-1',
    date: daysAgo(4),
    status: 'completed',
    project: 'Employee Portal',
    module: 'Dashboard',
    task: 'Coding',
    description: 'Built the attendance summary widgets on the dashboard',
    estimateHours: 5,
    actualHours: 5.5,
    completedDate: '2026-10-10',
  },
  {
    id: 'task-2',
    date: daysAgo(4),
    status: 'completed',
    project: 'Employee Portal',
    module: 'Authentication',
    task: 'Code Review',
    description: 'Reviewed the login and password reset pull requests',
    estimateHours: 3,
    actualHours: 4,
    completedDate: '2026-10-10',
  },
  {
    id: 'task-3',
    date: daysAgo(3),
    status: 'started',
    project: 'People Operations',
    module: 'Time Tracking',
    task: 'Coding',
    description: 'Timer screen for the mobile app',
    estimateHours: 6,
    actualHours: undefined,
    completedDate: '',
  },
  {
    id: 'task-4',
    date: daysAgo(3),
    status: 'not-started',
    project: 'People Operations',
    module: 'Reporting',
    task: 'API Testing',
    description: 'Test the weekly report endpoints',
    estimateHours: 2,
    actualHours: undefined,
    completedDate: '',
  },
  {
    id: 'task-5',
    date: daysAgo(2),
    status: 'hold',
    project: 'Employee Portal',
    module: 'Employee Management',
    task: 'API Documentation',
    description: 'Document the employee profile APIs (waiting on schema sign-off)',
    estimateHours: 3,
    actualHours: undefined,
    completedDate: '',
  },
  {
    id: 'task-6',
    date: daysAgo(2),
    status: 'completed',
    project: 'Employee Portal',
    module: 'General',
    task: 'Bug Fix',
    description: 'Fixed timezone handling in the leave balance API',
    estimateHours: 2,
    actualHours: 1.5,
    completedDate: '2026-10-12',
  },
  {
    id: 'task-7',
    date: daysAgo(1),
    status: 'started',
    project: 'Employee Portal',
    module: 'Reporting',
    task: 'Analysis',
    description: 'Analyse requirements for the monthly attendance report',
    estimateHours: 4,
    actualHours: undefined,
    completedDate: '',
  },
  {
    id: 'task-8',
    date: daysAgo(1),
    status: 'not-started',
    project: 'Employee Portal',
    module: 'Dashboard',
    task: 'Deployment',
    description: 'Deploy the dashboard changes to staging',
    estimateHours: 1,
    actualHours: undefined,
    completedDate: '',
  },
];
