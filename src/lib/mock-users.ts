import { ROUTES } from "./constants";

export type UserRole =
  | "employee"
  | "hr"
  | "project_manager"
  | "admin"
  | "system_admin"
  | "executive";

export interface MockUser {
  id: string;
  loginId: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  employeeId: string;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: "Employee",
  hr: "HR",
  project_manager: "Manager",
  admin: "Admin",
  system_admin: "System Admin",
  executive: "Executive",
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "EMP001",
    loginId: "employee",
    password: "employee123",
    name: "Kalai Priya",
    email: "employee@ionixx.com",
    role: "employee",
    department: "Engineering",
    designation: "Software Developer",
    employeeId: "EMP00101",
  },
  {
    id: "HR001",
    loginId: "hr",
    password: "hr123",
    name: "Priya Ramesh",
    email: "hr@ionixx.com",
    role: "hr",
    department: "Human Resources",
    designation: "HR Manager",
    employeeId: "HR00102",
  },
  {
    id: "PM001",
    loginId: "pm",
    password: "pm123",
    name: "Priya Kumar",
    email: "pm@ionixx.com",
    role: "project_manager",
    department: "Engineering",
    designation: "Project Manager",
    employeeId: "PM00103",
  },
  {
    id: "ADM001",
    loginId: "admin",
    password: "admin123",
    name: "Vikram Shah",
    email: "admin@ionixx.com",
    role: "admin",
    department: "Operations",
    designation: "Administrator",
    employeeId: "ADM00104",
  },
  {
    id: "SYS001",
    loginId: "sysadmin",
    password: "sysadmin123",
    name: "kaviya Iyer",
    email: "sysadmin@ionixx.com",
    role: "system_admin",
    department: "IT",
    designation: "System Administrator",
    employeeId: "SYS00105",
  },
  {
    id: "EXE001",
    loginId: "executive",
    password: "executive123",
    name: "Ananya Nair",
    email: "executive@ionixx.com",
    role: "executive",
    department: "Executive Office",
    designation: "Chief Executive",
    employeeId: "EXE00106",
  },
];

export const validateCredentials = (
  loginId: string,
  password: string
): MockUser | null => {
  const id = loginId.trim().toLowerCase();
  const match = MOCK_USERS.find(
    (u) =>
      (u.loginId.toLowerCase() === id || u.email.toLowerCase() === id) &&
      u.password === password
  );
  return match ?? null;
};

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

export const SIDEBAR_ITEMS = {
  // Common
  dashboard: { id: "dashboard", label: "Dashboard", icon: "Home", path: ROUTES.Dashboard },
  profile: { id: "profile", label: "Profile", icon: "User", path: ROUTES.Profile },

  // Employee
  attendance: { id: "attendance", label: "Attendance", icon: "Clock", path: ROUTES.Attendance },
  timeTracker: { id: "time-tracker", label: "Time Tracker", icon: "Timer", path: ROUTES.TimeTracker },
  leave: { id: "leave", label: "Leave Tracker", icon: "Calendar", path: ROUTES.Leave },
  pay: { id: "pay", label: "Pay & Tax", icon: "Wallet", path: ROUTES.Pay },
  tasks: { id: "tasks", label: "Tasks", icon: "CheckSquare", path: ROUTES.Tasks },
  files: { id: "files", label: "Files", icon: "Folder", path: ROUTES.Files },
  organization: { id: "organization", label: "Organization", icon: "Building", path: ROUTES.Organization },
  reports: { id: "reports", label: "Reports", icon: "BarChart3", path: ROUTES.Reports },

  // Manager (MSS)
  teamOverview: { id: "team", label: "Team Overview", icon: "Users", path: ROUTES.TeamOverview },
  approvals: { id: "approvals", label: "Approvals", icon: "CheckCheck", path: ROUTES.Approvals },
  attendanceMonitoring: { id: "attendance-monitoring", label: "Attendance Monitoring", icon: "ClipboardCheck", path: ROUTES.AttendanceMonitoring },
  performanceReview: { id: "performance-review", label: "Performance Review", icon: "Star", path: ROUTES.PerformanceReview },

  // HR
  employeeManagement: { id: "employee-management", label: "Employee Management", icon: "UserCog", path: ROUTES.EmployeeManagement },
  recruitment: { id: "recruitment", label: "Recruitment", icon: "Briefcase", path: ROUTES.Recruitment },
  training: { id: "training", label: "Training", icon: "GraduationCap", path: ROUTES.Training },
  compliance: { id: "compliance", label: "Compliance", icon: "ShieldCheck", path: ROUTES.Compliance },

  // Executive
  analytics: { id: "analytics", label: "Analytics", icon: "LineChart", path: ROUTES.Analytics },
  kpiMonitoring: { id: "kpi-monitoring", label: "KPI Monitoring", icon: "Gauge", path: ROUTES.KpiMonitoring },

  // Service desk: everyone follows their requests; Admin (office operations) works the queue
  myRequests: { id: "my-requests", label: "My Requests", icon: "LifeBuoy", path: ROUTES.ServiceDesk },
  serviceDesk: { id: "service-desk", label: "Service Desk", icon: "LifeBuoy", path: ROUTES.ServiceDesk },
  assetLog: { id: "asset-log", label: "Asset Log", icon: "Laptop", path: ROUTES.AssetLog },
  expenses: { id: "expenses", label: "Expenses", icon: "Receipt", path: ROUTES.Expenses },
  deskReports: { id: "desk-reports", label: "Desk Reports", icon: "PieChart", path: ROUTES.DeskReports },

  // System Admin
  userManagement: { id: "user-management", label: "User Management", icon: "Users2", path: ROUTES.UserManagement },
  rolesPermissions: { id: "roles-permissions", label: "Roles & Permissions", icon: "Lock", path: ROUTES.RolesPermissions },
  systemConfig: { id: "system-config", label: "System Config", icon: "Settings", path: ROUTES.SystemConfig },
  integrations: { id: "integrations", label: "Integrations", icon: "Plug", path: ROUTES.Integrations },
  logs: { id: "logs", label: "Logs", icon: "ScrollText", path: ROUTES.Logs },
} as const satisfies Record<string, SidebarItem>;
const ITEM = SIDEBAR_ITEMS;

export const ROLE_SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  employee: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.attendance,
    ITEM.timeTracker,
    ITEM.leave,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.files,
    ITEM.organization,
  ],
  project_manager: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.files,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.teamOverview,
    ITEM.approvals,
    ITEM.attendanceMonitoring,
    ITEM.performanceReview,
    ITEM.reports,
  ],
  hr: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.files,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.employeeManagement,
    ITEM.recruitment,
    ITEM.training,
    ITEM.compliance,
    ITEM.reports,
  ],
  executive: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.files,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.analytics,
    ITEM.kpiMonitoring,
    ITEM.reports,
  ],
  system_admin: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.files,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.userManagement,
    ITEM.rolesPermissions,
    ITEM.systemConfig,
    ITEM.integrations,
    ITEM.logs,
  ],
  // Admin is office operations: the service desk, assets and expenses (no project tasks or system config)
  admin: [ITEM.dashboard, ITEM.profile, ITEM.pay, ITEM.files, ITEM.serviceDesk, ITEM.assetLog, ITEM.expenses, ITEM.deskReports],
};

export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
  // Common
  [ROUTES.Dashboard]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Profile]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Reports]: ["hr", "project_manager", "executive"],

  // Employee
  [ROUTES.Attendance]: ["employee"],
  [ROUTES.TimeTracker]: ["employee"],
  [ROUTES.Leave]: ["employee"],
  // Everyone is paid, so everyone sees their own pay and tax
  [ROUTES.Pay]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Tasks]: ["employee", "hr", "project_manager", "system_admin", "executive"],
  // Everyone has their own documents (offer letter, Form 16…) plus company and department files
  [ROUTES.Files]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Organization]: ["employee"],

  // Manager (MSS)
  [ROUTES.TeamOverview]: ["project_manager"],
  [ROUTES.Approvals]: ["project_manager"],
  [ROUTES.AttendanceMonitoring]: ["project_manager"],
  [ROUTES.PerformanceReview]: ["project_manager"],

  // HR
  [ROUTES.EmployeeManagement]: ["hr"],
  [ROUTES.Recruitment]: ["hr"],
  [ROUTES.Training]: ["hr"],
  [ROUTES.Compliance]: ["hr"],

  // Executive
  [ROUTES.Analytics]: ["executive"],
  [ROUTES.KpiMonitoring]: ["executive"],

  // System Admin
  [ROUTES.UserManagement]: ["system_admin"],
  [ROUTES.RolesPermissions]: ["system_admin"],
  [ROUTES.SystemConfig]: ["system_admin"],
  [ROUTES.Integrations]: ["system_admin"],
  [ROUTES.Logs]: ["system_admin"],

  // Service desk
  [ROUTES.ServiceDesk]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.AssetLog]: ["admin"],
  [ROUTES.Expenses]: ["admin"],
  [ROUTES.DeskReports]: ["admin"],
};

export const DEMO_ACCOUNTS: Array<{ role: UserRole; loginId: string; password: string }> =
  MOCK_USERS.map((u) => ({ role: u.role, loginId: u.loginId, password: u.password }));
