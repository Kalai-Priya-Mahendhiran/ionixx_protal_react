export const endpoints = {
  // Auth
  login: "api/auth/login",
  forgotPassword: "api/auth/forgot-password",
  resetPassword: "api/auth/reset-password",
  logout: "api/auth/logout",
  
  // Profile
  profile: "api/profile",
  updateProfile: "api/profile/update",
  
  // Attendance
  attendance: "api/attendance",
  checkIn: "api/attendance/check-in",
  checkOut: "api/attendance/check-out",
  attendanceHistory: "api/attendance/history",
  
  // Time Tracker
  timeEntries: "api/time-tracker/entries",
  createTimeEntry: "api/time-tracker/entries",
  updateTimeEntry: "api/time-tracker/entries",
  deleteTimeEntry: "api/time-tracker/entries",
  
  // Leave
  leaveRequests: "api/leave/requests",
  createLeaveRequest: "api/leave/requests",
  updateLeaveRequest: "api/leave/requests",
  leaveBalance: "api/leave/balance",
  
  // Tasks (the backend must enforce the same permission matrix as lib/permissions/task-permissions.ts)
  tasks: "api/tasks", // GET list (visible to caller), POST create
  task: "api/tasks/:id", // GET, PATCH, DELETE
  taskStatus: "api/tasks/:id/status", // POST { status }
  duplicateTask: "api/tasks/:id/duplicate", // POST
  projects: "api/projects",
  sprints: "api/sprints", // GET, scoped to projects the caller belongs to
  epics: "api/epics", // GET epic summaries for the epic picker
  userDirectory: "api/users/directory",
  
  // Files
  files: "api/files",
  uploadFile: "api/files/upload",
  downloadFile: "api/files/download",
  deleteFile: "api/files",
  
  // Organization
  organization: "api/organization",
  employees: "api/organization/employees",
  departments: "api/organization/departments",
  
  // Reports
  reports: "api/reports",
  attendanceReport: "api/reports/attendance",
  leaveReport: "api/reports/leave",
  timeTrackerReport: "api/reports/time-tracker",
  taskReport: "api/reports/tasks",
} as const;
