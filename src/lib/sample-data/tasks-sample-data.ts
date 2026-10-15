import { toDateInput } from '@/lib/utils';
import type { Project, Sprint, Task } from '@/types';

// Dates are relative to today so overdue / due-soon states always show up in the demo
const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

const timestampDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const sampleProjects: Project[] = [
  {
    id: 'PRJ-IXP',
    key: 'IXP',
    name: 'Ionixx Portal',
    description: 'Employee portal product work',
    leadId: 'PM001',
    memberIds: ['PM001', 'EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'EMP006'],
    defaultIssueType: 'task',
  },
  {
    id: 'PRJ-HR',
    key: 'HR',
    name: 'People Operations',
    description: 'Onboarding, offboarding and HR processes',
    leadId: 'HR001',
    memberIds: ['HR001'],
    defaultIssueType: 'hr',
  },
];

const PREVIOUS_SPRINT_ID = 'SPR-IXP-14';
const ACTIVE_SPRINT_ID = 'SPR-IXP-15';
const NEXT_SPRINT_ID = 'SPR-IXP-16';
const TASKS_EPIC_ID = 'TSK-EPIC-1';

// Two-week sprints around today: one finished, one running, one planned
export const sampleSprints: Sprint[] = [
  { id: PREVIOUS_SPRINT_ID, projectId: 'PRJ-IXP', name: 'IXP Sprint 14', startDate: daysFromNow(-21), endDate: daysFromNow(-8), status: 'completed' },
  {
    id: ACTIVE_SPRINT_ID, projectId: 'PRJ-IXP', name: 'IXP Sprint 15', goal: 'Ship the Leave Tracker calendar and auth fixes',
    startDate: daysFromNow(-7), endDate: daysFromNow(6), status: 'active',
  },
  { id: NEXT_SPRINT_ID, projectId: 'PRJ-IXP', name: 'IXP Sprint 16', startDate: daysFromNow(7), endDate: daysFromNow(20), status: 'planned' },
];

type SampleTask = Pick<Task, 'key' | 'projectId' | 'type' | 'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'reporterId'> &
  Partial<Task> & { dueInDays: number; createdDaysAgo: number; startInDays?: number };

const SAMPLE_TASKS: SampleTask[] = [
  {
    key: 'IXP-101', projectId: 'PRJ-IXP', type: 'task', title: 'Update API documentation', sprintId: PREVIOUS_SPRINT_ID, startInDays: -12,
    description: 'Document the new attendance and leave endpoints in the API reference.',
    status: 'done', priority: 'medium', assigneeId: 'EMP001', reporterId: 'PM001',
    labels: ['docs'], estimateHours: 6, loggedHours: 5, dueInDays: -5, createdDaysAgo: 14,
  },
  {
    key: 'IXP-102', projectId: 'PRJ-IXP', type: 'task', title: 'Code review: authentication module', sprintId: ACTIVE_SPRINT_ID, epicId: TASKS_EPIC_ID, startInDays: -4,
    description: 'Review the pull request that moves login to the new auth context.',
    status: 'in-progress', priority: 'high', assigneeId: 'EMP001', reporterId: 'PM001',
    labels: ['review'], estimateHours: 4, loggedHours: 2, dueInDays: 1, createdDaysAgo: 6,
  },
  {
    key: 'IXP-103', projectId: 'PRJ-IXP', type: 'bug', title: 'Login fails on mobile Safari', sprintId: ACTIVE_SPRINT_ID, startInDays: -3,
    description: 'Users on iOS 17 get stuck on the login screen after submitting valid credentials.',
    status: 'todo', priority: 'urgent', assigneeId: 'EMP001', reporterId: 'PM001',
    labels: ['mobile', 'auth'], estimateHours: 8, loggedHours: 0, dueInDays: -2, createdDaysAgo: 4,
  },
  {
    key: 'IXP-104', projectId: 'PRJ-IXP', type: 'story', title: 'Leave calendar shows team holidays', sprintId: ACTIVE_SPRINT_ID, epicId: TASKS_EPIC_ID, startInDays: -6,
    description: 'As an employee I want to see public and restricted holidays on the leave calendar.',
    status: 'in-review', priority: 'medium', assigneeId: 'EMP001', reporterId: 'PM001',
    labels: ['leave-tracker'], estimateHours: 12, loggedHours: 11, dueInDays: 3, createdDaysAgo: 10,
  },
  {
    key: 'IXP-105', projectId: 'PRJ-IXP', type: 'task', title: 'Prepare React 19 knowledge share',
    description: 'Personal task: slides on the new React 19 features for Friday tech talk.',
    status: 'todo', priority: 'low', assigneeId: 'EMP001', reporterId: 'EMP001',
    labels: ['learning'], estimateHours: 3, loggedHours: 0, dueInDays: 10, createdDaysAgo: 1,
  },
  {
    key: 'IXP-106', projectId: 'PRJ-IXP', type: 'task', title: 'Cache dependencies in CI pipeline', sprintId: ACTIVE_SPRINT_ID, startInDays: -5,
    description: 'Cut build time by caching the pnpm store between CI runs.',
    status: 'in-progress', priority: 'high', assigneeId: 'EMP005', reporterId: 'PM001',
    labels: ['devops'], estimateHours: 5, loggedHours: 3, dueInDays: 2, createdDaysAgo: 7,
    isBlocked: true, blockedReason: 'Waiting for AWS access to the build bucket',
  },
  {
    key: 'IXP-107', projectId: 'PRJ-IXP', type: 'bug', title: 'Dashboard loads slowly for managers', sprintId: ACTIVE_SPRINT_ID, epicId: TASKS_EPIC_ID,
    description: 'Team dashboard takes over 6 seconds to render for managers with large teams.',
    status: 'todo', priority: 'high', assigneeId: 'EMP002', reporterId: 'PM001',
    labels: ['performance'], estimateHours: 8, loggedHours: 0, dueInDays: 0, createdDaysAgo: 3,
  },
  {
    key: 'IXP-108', projectId: 'PRJ-IXP', type: 'story', title: 'New badge styles in the design system', sprintId: ACTIVE_SPRINT_ID, epicId: TASKS_EPIC_ID, startInDays: -7,
    description: 'Align status and priority badges with the updated purple theme.',
    status: 'in-review', priority: 'low', assigneeId: 'EMP004', reporterId: 'PM001',
    labels: ['design'], estimateHours: 6, loggedHours: 6, dueInDays: 4, createdDaysAgo: 9,
  },
  {
    key: 'IXP-109', projectId: 'PRJ-IXP', type: 'task', title: 'Regression suite for Time Tracker', sprintId: NEXT_SPRINT_ID,
    description: 'Automate the Time Tracker happy-path and validation scenarios.',
    status: 'reopened', priority: 'medium', assigneeId: 'EMP003', reporterId: 'PM001',
    labels: ['qa'], estimateHours: 10, loggedHours: 7, dueInDays: 6, createdDaysAgo: 12,
  },
  {
    key: 'IXP-110', projectId: 'PRJ-IXP', type: 'epic', title: 'Tasks module revamp', id: TASKS_EPIC_ID, startInDays: -5,
    description: 'Role-based, Jira-style task management for every portal user.',
    status: 'in-progress', priority: 'high', assigneeId: 'PM001', reporterId: 'ADM001',
    labels: ['roadmap'], estimateHours: 120, loggedHours: 18, dueInDays: 30, createdDaysAgo: 5,
  },
  {
    key: 'IXP-111', projectId: 'PRJ-IXP', type: 'task', title: 'Export org chart as PDF', sprintId: PREVIOUS_SPRINT_ID, startInDays: -14,
    description: 'Add a PDF export button to the organization chart.',
    status: 'done', priority: 'low', assigneeId: 'EMP006', reporterId: 'PM001',
    labels: ['organization'], estimateHours: 4, loggedHours: 4, dueInDays: -8, createdDaysAgo: 15,
  },
  {
    key: 'HR-1', projectId: 'PRJ-HR', type: 'hr', title: 'Onboarding: laptop and ID card for new joiner',
    description: 'Request laptop provisioning and an ID card for the joiner starting next week.',
    status: 'todo', priority: 'high', assigneeId: 'HR001', reporterId: 'HR001',
    labels: ['onboarding'], loggedHours: 0, dueInDays: 2, createdDaysAgo: 2,
  },
  {
    key: 'HR-2', projectId: 'PRJ-HR', type: 'hr', title: 'Exit interview: Platform team',
    description: 'Schedule and run the exit interview, then file the feedback form.',
    status: 'in-progress', priority: 'medium', assigneeId: 'HR001', reporterId: 'HR001',
    labels: ['offboarding'], loggedHours: 1, dueInDays: 1, createdDaysAgo: 4,
  },
  {
    key: 'HR-3', projectId: 'PRJ-HR', type: 'hr', title: 'Acknowledge Q4 policy updates',
    description: 'Read the updated leave and remote-work policies and acknowledge them in the portal.',
    status: 'todo', priority: 'medium', assigneeId: 'EMP001', reporterId: 'HR001',
    labels: ['compliance'], loggedHours: 0, dueInDays: 5, createdDaysAgo: 3,
  },
  {
    key: 'HR-4', projectId: 'PRJ-HR', type: 'hr', title: 'Background verification for new joiner',
    description: 'Collect documents and send them to the verification agency.',
    status: 'done', priority: 'low', assigneeId: 'HR001', reporterId: 'HR001',
    labels: ['onboarding'], loggedHours: 2, dueInDays: -3, createdDaysAgo: 11,
  },
];

export const sampleTasks: Task[] = SAMPLE_TASKS.map(({ dueInDays, createdDaysAgo, startInDays, ...task }, index) => ({
  id: `TSK-${index + 1}`,
  watcherIds: [],
  labels: [],
  loggedHours: 0,
  isBlocked: false,
  attachments: [],
  ...task,
  startDate: startInDays === undefined ? undefined : daysFromNow(startInDays),
  dueDate: daysFromNow(dueInDays),
  createdAt: timestampDaysAgo(createdDaysAgo),
  updatedAt: timestampDaysAgo(Math.max(0, createdDaysAgo - 1)),
}));
