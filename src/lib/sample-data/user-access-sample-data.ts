import type { AccessRecord, TaskUser } from '@/types';

/*
 * Demo account data for User Management. Everyone not listed here is active with their role's default pages.
 * With the backend this comes from GET /api/users.
 */

const daysAgo = (days: number, hour = 9) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

// A former employee kept for history (their old tasks and audit entries still name them)
export const formerStaff: TaskUser[] = [
  { id: 'EMP008', name: 'Naveen Kumar', email: 'naveen.kumar@ionixx.com', role: 'employee', department: 'Engineering', designation: 'Software Developer', managerId: 'PM001' },
];

export const sampleAccessRecords: Record<string, AccessRecord> = {
  EMP001: { status: 'active', grantedModules: [], revokedModules: [], phone: '+91 98400 12345', lastSignInAt: daysAgo(0) },
  HR001: { status: 'active', grantedModules: [], revokedModules: [], lastSignInAt: daysAgo(0, 10) },
  // A senior engineer who also helps with team reports
  EMP002: { status: 'active', grantedModules: ['/reports'], revokedModules: [], lastSignInAt: daysAgo(1) },
  PM001: { status: 'active', grantedModules: [], revokedModules: [], lastSignInAt: daysAgo(0, 8) },
  ADM001: { status: 'active', grantedModules: [], revokedModules: [], lastSignInAt: daysAgo(1, 11) },
  SYS001: { status: 'active', grantedModules: [], revokedModules: [], lastSignInAt: daysAgo(0, 7) },
  EXE001: { status: 'active', grantedModules: [], revokedModules: [], lastSignInAt: daysAgo(3) },
  EMP008: { status: 'deactivated', grantedModules: [], revokedModules: [], deactivatedAt: daysAgo(40), lastSignInAt: daysAgo(41) },
};
