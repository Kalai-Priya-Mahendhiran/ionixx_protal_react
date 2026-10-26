import {
  CalendarPlus,
  Flower2,
  Plane,
  Award,
  Baby,
  BarChart3,
  Briefcase,
  Building,
  Cake,
  Calendar,
  CalendarDays,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Coffee,
  FileText,
  Folder,
  Gauge,
  Gift,
  Heart,
  GraduationCap,
  HeartHandshake,
  Home,
  Laptop,
  LifeBuoy,
  PieChart,
  Receipt,
  LineChart,
  Lock,
  Moon,
  Plug,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  Sun,
  Sunset,
  Target,
  Timer,
  TrendingUp,
  Upload,
  User,
  UserCog,
  Users,
  Users2,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "./mock-users";

export const ROUTES = {
  Login: "/login",
  ForgotPassword: "/forgot-password",
  Dashboard: "/dashboard",
  Profile: "/profile",
  Attendance: "/attendance",
  TimeTracker: "/time-tracker",
  Leave: "/leave",
  Pay: "/pay",
  Files: "/files",
  Organization: "/organization",
  Tasks: "/tasks",
  Reports: "/reports",
  // Manager (MSS)
  TeamOverview: "/team",
  Approvals: "/approvals",
  AttendanceMonitoring: "/attendance-monitoring",
  PerformanceReview: "/performance-review",
  // HR
  EmployeeManagement: "/employee-management",
  Recruitment: "/recruitment",
  Training: "/training",
  Compliance: "/compliance",
  // Executive
  Analytics: "/analytics",
  KpiMonitoring: "/kpi-monitoring",
  // System Admin
  UserManagement: "/user-management",
  RolesPermissions: "/roles-permissions",
  SystemConfig: "/system-config",
  Integrations: "/integrations",
  Logs: "/logs",
  // Admin (office operations) service desk
  ServiceDesk: "/service-desk",
  AssetLog: "/service-desk/assets",
  Expenses: "/service-desk/expenses",
  DeskReports: "/service-desk/reports",
} ;

// Quick Add and Quick Actions: see lib/quick-actions.ts

/*
 * Menus: every page in the portal, the sidebar item for each, each role's menu and which roles can open each page.
 * Who sees what is worked out from these in lib/modules.ts (role default, personal grants and removals, managers).
 */

// Every page, with the name used in User Management, Roles & Permissions, search and the header
export interface PortalModule {
  path: string;
  label: string;
  group: string;
}

export const MODULE_CATALOG: PortalModule[] = [
  { path: ROUTES.Dashboard, label: "Dashboard", group: "Everyone" },
  { path: ROUTES.Profile, label: "Profile", group: "Everyone" },
  { path: ROUTES.Attendance, label: "Attendance", group: "Self-service" },
  { path: ROUTES.TimeTracker, label: "Time Tracker", group: "Self-service" },
  { path: ROUTES.Leave, label: "Leave Tracker", group: "Self-service" },
  { path: ROUTES.Pay, label: "Pay & Tax", group: "Self-service" },
  { path: ROUTES.Files, label: "Files", group: "Self-service" },
  { path: ROUTES.Organization, label: "Organization", group: "Self-service" },
  { path: ROUTES.Tasks, label: "Tasks", group: "Work" },
  { path: ROUTES.ServiceDesk, label: "Service Desk / My Requests", group: "Work" },
  { path: ROUTES.Reports, label: "Reports", group: "Work" },
  { path: ROUTES.TeamOverview, label: "Team Overview", group: "Team management" },
  { path: ROUTES.Approvals, label: "Approvals", group: "Team management" },
  { path: ROUTES.AttendanceMonitoring, label: "Attendance Monitoring", group: "Team management" },
  { path: ROUTES.PerformanceReview, label: "Performance Review", group: "Team management" },
  { path: ROUTES.EmployeeManagement, label: "Employee Management", group: "HR" },
  { path: ROUTES.Recruitment, label: "Recruitment", group: "HR" },
  { path: ROUTES.Training, label: "Training", group: "HR" },
  { path: ROUTES.Compliance, label: "Compliance", group: "HR" },
  { path: ROUTES.Analytics, label: "Analytics", group: "Executive" },
  { path: ROUTES.KpiMonitoring, label: "KPI Monitoring", group: "Executive" },
  { path: ROUTES.AssetLog, label: "Asset Log", group: "Office operations" },
  { path: ROUTES.Expenses, label: "Expenses", group: "Office operations" },
  { path: ROUTES.DeskReports, label: "Desk Reports", group: "Office operations" },
  { path: ROUTES.UserManagement, label: "User Management", group: "System" },
  { path: ROUTES.RolesPermissions, label: "Roles & Permissions", group: "System" },
  { path: ROUTES.SystemConfig, label: "System Config", group: "System" },
  { path: ROUTES.Integrations, label: "Integrations", group: "System" },
  { path: ROUTES.Logs, label: "Logs", group: "System" },
];

// Sidebar menu items
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  // The page (module) — page access is checked on this
  path: string;
  // Optional query that picks a view of the page, e.g. 'tab=mine' on the Service Desk
  search?: string;
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
  // Always the person's own requests, even for people who also work a desk queue
  myRequests: { id: "my-requests", label: "My Requests", icon: "LifeBuoy", path: ROUTES.ServiceDesk, search: "tab=mine" },
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
  // Workflow, fields, permissions and automation for the Tasks module
  taskSettings: { id: "task-settings", label: "Task Settings", icon: "Settings", path: ROUTES.Tasks, search: "view=settings" },
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
    ITEM.attendance,
    ITEM.timeTracker,
    ITEM.leave,
    ITEM.files,
    ITEM.organization,
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
    ITEM.attendance,
    ITEM.timeTracker,
    ITEM.leave,
    ITEM.files,
    ITEM.organization,
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
    ITEM.attendance,
    ITEM.timeTracker,
    ITEM.leave,
    ITEM.files,
    ITEM.organization,
    ITEM.tasks,
    ITEM.myRequests,
    ITEM.analytics,
    ITEM.kpiMonitoring,
    ITEM.reports,
  ],
  // System Admin works the access/software desk, so they get the queue and their own requests as separate items
  system_admin: [
    ITEM.dashboard,
    ITEM.profile,
    ITEM.pay,
    ITEM.attendance,
    ITEM.timeTracker,
    ITEM.leave,
    ITEM.files,
    ITEM.organization,
    ITEM.tasks,
    ITEM.taskSettings,
    ITEM.serviceDesk,
    ITEM.myRequests,
    ITEM.userManagement,
    ITEM.rolesPermissions,
    ITEM.systemConfig,
    ITEM.integrations,
    ITEM.logs,
  ],
  // Admin is office operations: the service desk, assets and expenses (no project tasks or system config)
  admin: [ITEM.dashboard, ITEM.profile, ITEM.pay, ITEM.attendance, ITEM.timeTracker, ITEM.leave, ITEM.files, ITEM.organization, ITEM.serviceDesk, ITEM.myRequests, ITEM.assetLog, ITEM.expenses, ITEM.deskReports],
};

export const ROLE_ROUTE_ACCESS: Record<string, UserRole[]> = {
  // Common
  [ROUTES.Dashboard]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Profile]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Reports]: ["hr", "project_manager", "executive"],

  // Employee
  // Everyone checks in, logs time and takes leave, whatever their role
  [ROUTES.Attendance]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.TimeTracker]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Leave]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  // Everyone is paid, so everyone sees their own pay and tax
  [ROUTES.Pay]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  [ROUTES.Tasks]: ["employee", "hr", "project_manager", "system_admin", "executive"],
  // Everyone has their own documents (offer letter, Form 16…) plus company and department files
  [ROUTES.Files]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],
  // Everyone can look up colleagues and reporting lines
  [ROUTES.Organization]: ["employee", "hr", "project_manager", "admin", "system_admin", "executive"],

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

export const LEAVE_TYPES = [
  { id: "casual", label: "Casual Leave", color: "bg-blue-100 text-blue-800", icon: "Coffee", iconClass: "bg-blue-100 text-blue-600" },
  { id: "sick", label: "Sick Leave", color: "bg-red-100 text-red-800", icon: "Stethoscope", iconClass: "bg-red-100 text-red-600" },
  { id: "earned", label: "Earned Leave", color: "bg-green-100 text-green-800", icon: "Award", iconClass: "bg-green-100 text-green-600" },
  { id: "loss-of-pay", label: "Loss Of Pay", color: "bg-slate-200 text-slate-800", icon: "Wallet", iconClass: "bg-slate-200 text-slate-600" },
  // Earned by working on a holiday or weekend and taken as a day off; named "Off" because it is time owed, not a leave entitlement
  { id: "compensatory-off", label: "Compensatory Off", color: "bg-teal-100 text-teal-800", icon: "CalendarPlus", iconClass: "bg-teal-100 text-teal-600" },
  { id: "permission", label: "Permission", color: "bg-cyan-100 text-cyan-800", icon: "Clock", iconClass: "bg-cyan-100 text-cyan-600" },
  { id: "marriage", label: "Marriage Leave", color: "bg-rose-100 text-rose-800", icon: "Heart", iconClass: "bg-rose-100 text-rose-600" },
  { id: "paternity", label: "Paternity Leave", color: "bg-purple-100 text-purple-800", icon: "Users", iconClass: "bg-purple-100 text-purple-600" },
  { id: "maternity", label: "Maternity Leave", color: "bg-pink-100 text-pink-800", icon: "Baby", iconClass: "bg-pink-100 text-pink-600" },
  { id: "restricted-holiday", label: "Restricted Holiday", color: "bg-amber-100 text-amber-800", icon: "CalendarDays", iconClass: "bg-amber-100 text-amber-600" },
  { id: "bereavement", label: "Bereavement Leave", color: "bg-indigo-100 text-indigo-800", icon: "Flower2", iconClass: "bg-indigo-100 text-indigo-600" },
  { id: "sabbatical", label: "Sabbatical Leave", color: "bg-orange-100 text-orange-800", icon: "Plane", iconClass: "bg-orange-100 text-orange-600" },
] ;

// Leave Tracker
export const LEAVE_DAY_PARTS = [
  { value: "full-day", label: "Full Day" },
  { value: "first-half", label: "First Half" },
  { value: "second-half", label: "Second Half" },
];

export const LEAVE_STATUS_COLORS = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export const LEAVE_STATUS_LABELS = {
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

export const LEAVE_STATUS_FILTER_OPTIONS = [
  { value: "pending", label: "Pending Requests" },
  { value: "approved", label: "Approved Requests" },
  { value: "rejected", label: "Rejected Requests" },
] as const;

// Leave Calendar matches the Apply Leave height on large screens and scrolls internally
export const LEAVE_CALENDAR_PANEL_CLASS = "flex flex-col max-h-[680px] lg:max-h-none lg:absolute lg:inset-0";
export const LEAVE_HISTORY_MAX_HEIGHT_CLASS = "max-h-[440px]";

export const LEAVE_COUNTRIES = [
  { value: "india", label: "India" },
  { value: "canada", label: "Canada" },
  { value: "united-states", label: "United States" },
];

export const DEFAULT_LEAVE_COUNTRY = "india" as const;

export const WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Leave calendar day markers, listed in legend order
export const LEAVE_CALENDAR_DAY_STYLES = {
  "on-leave": { label: "On Leave", cell: "bg-[#464EB8] text-white border-[#464EB8]", swatch: "bg-[#464EB8] border-[#464EB8]" },
  "working-day": { label: "Working Day", cell: "bg-emerald-50 text-emerald-800 border-emerald-200", swatch: "bg-emerald-50 border-emerald-300" },
  "public-holiday": { label: "Public Holiday", cell: "bg-rose-100 text-rose-800 border-rose-200", swatch: "bg-rose-100 border-rose-300" },
  "restricted-holiday": { label: "Restricted Holiday", cell: "bg-amber-100 text-amber-800 border-amber-200", swatch: "bg-amber-100 border-amber-300" },
  weekend: { label: "Weekend", cell: "bg-gray-100 text-gray-400 border-gray-200", swatch: "bg-gray-100 border-gray-300" },
};

export const RESTRICTED_HOLIDAY_NOTE = {
  title: "Important Note - Restricted Holidays",
  description: "In addition to the public holidays, associates are entitled to avail any one restricted holiday in a year from the restricted holiday list.",
  warning: "Prior approval is required at least 10 working days in advance from your reporting authority.",
};

export const HOLIDAY_TYPE_COLORS = {
  public: "bg-rose-100 text-rose-800",
  restricted: "bg-amber-100 text-amber-800",
};

export const HOLIDAY_TYPE_LABELS = {
  public: "Public",
  restricted: "Restricted",
};

export const ATTENDANCE_STATUS = [
  { id: "present", label: "Present", color: "bg-green-100 text-green-800" },
  { id: "absent", label: "Absent", color: "bg-red-100 text-red-800" },
  { id: "late", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { id: "half-day", label: "Half Day", color: "bg-orange-100 text-orange-800" },
] ;

// Time Tracker
export const TIME_TRACKER_STATUS_LABELS = {
  "not-started": "Not started",
  started: "Started",
  completed: "Completed",
  hold: "Hold",
};

export const TIME_TRACKER_STATUS_COLORS = {
  "not-started": "bg-yellow-100 text-yellow-800",
  started: "bg-white text-gray-700 border border-gray-300",
  completed: "bg-green-100 text-green-800",
  hold: "bg-[#BBBBBB] text-gray-800",
};

export const DAILY_HOUR_LIMIT = 8;

// Reports
export const REPORT_DATE_RANGES = [
  { id: "this-week", label: "This Week" },
  { id: "this-month", label: "This Month" },
  { id: "last-month", label: "Last Month" },
  { id: "this-quarter", label: "This Quarter" },
  { id: "this-year", label: "This Year" },
  { id: "custom", label: "Custom Range" },
];

// KPI Monitoring
export const KPI_STATUS_CONFIG = {
  "on-track": {
    label: "On track",
    tone: "bg-green-100 text-green-700",
    ring: "stroke-green-500",
    bar: "bg-green-500",
  },
  "at-risk": {
    label: "At risk",
    tone: "bg-amber-100 text-amber-700",
    ring: "stroke-amber-500",
    bar: "bg-amber-500",
  },
  "off-track": {
    label: "Off track",
    tone: "bg-red-100 text-red-700",
    ring: "stroke-red-500",
    bar: "bg-red-500",
  },
};

// Compliance
export const COMPLIANCE_DOC_STATUS_COLORS = {
  valid: "bg-green-100 text-green-800",
  expiring: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
  missing: "bg-gray-200 text-gray-700",
};

export const COMPLIANCE_DOC_STATUS_LABELS = {
  valid: "Valid",
  expiring: "Expiring soon",
  expired: "Expired",
  missing: "Missing",
};

export const COMPLIANCE_EMPLOYEE_STATUS_COLORS = {
  compliant: "bg-green-100 text-green-800",
  partial: "bg-amber-100 text-amber-800",
  "non-compliant": "bg-red-100 text-red-800",
};

export const COMPLIANCE_EMPLOYEE_STATUS_LABELS = {
  compliant: "Compliant",
  partial: "Partial",
  "non-compliant": "Non-compliant",
};

export const COMPLIANCE_AUDIT_TYPE_COLORS = {
  upload: "bg-blue-100 text-blue-800",
  update: "bg-purple-100 text-purple-800",
  review: "bg-teal-100 text-teal-800",
  delete: "bg-red-100 text-red-800",
  assign: "bg-indigo-100 text-indigo-800",
};

// Employee Management
export const EMPLOYMENT_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  "on-leave": "bg-orange-100 text-orange-800",
  inactive: "bg-gray-200 text-gray-700",
};

export const EMPLOYMENT_STATUS_LABELS = {
  active: "Active",
  "on-leave": "On leave",
  inactive: "Inactive",
};

// Recruitment
export const CANDIDATE_STAGE_ORDER = [
  "applied",
  "screening",
  "interview",
  "offer",
  "hired",
] as const;

export const CANDIDATE_STAGE_LABELS = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const CANDIDATE_STAGE_COLORS = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-800",
  interview: "bg-purple-100 text-purple-800",
  offer: "bg-amber-100 text-amber-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export const JOB_POSTING_STATUS_COLORS = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-700",
  draft: "bg-amber-100 text-amber-800",
};

export const INTERVIEW_MODE_COLORS = {
  "On-site": "bg-indigo-100 text-indigo-800",
  Video: "bg-blue-100 text-blue-800",
  Phone: "bg-teal-100 text-teal-800",
};

// Training
export const COURSE_LEVEL_COLORS = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-blue-100 text-blue-800",
  Advanced: "bg-purple-100 text-purple-800",
};

export const COURSE_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-gray-200 text-gray-700",
};

export const TRAINING_ASSIGNMENT_STATUS_COLORS = {
  "not-started": "bg-gray-100 text-gray-700",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

export const TRAINING_ASSIGNMENT_STATUS_LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

// Approvals
export const APPROVAL_TYPE_LABELS = {
  leave: "Leave",
  "time-off": "Time off",
  wfh: "Work from home",
  expense: "Expense",
};

export const APPROVAL_TYPE_COLORS = {
  leave: "bg-blue-100 text-blue-800",
  "time-off": "bg-purple-100 text-purple-800",
  wfh: "bg-teal-100 text-teal-800",
  expense: "bg-amber-100 text-amber-800",
  declaration: "bg-indigo-100 text-indigo-800",
};

// Team Overview
export const TEAM_MEMBER_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  "on-leave": "bg-orange-100 text-orange-800",
  remote: "bg-blue-100 text-blue-800",
  "not-in": "bg-gray-100 text-gray-700",
};

export const TEAM_MEMBER_STATUS_LABELS = {
  active: "In office",
  "on-leave": "On leave",
  remote: "Remote",
  "not-in": "Not checked in",
};

// Integrations
export const INTEGRATION_STATUS_STYLES = {
  connected: "bg-emerald-100 text-emerald-700",
  disconnected: "bg-gray-200 text-gray-600",
  error: "bg-red-100 text-red-700",
};

export const INTEGRATION_STATUS_LABELS = {
  connected: "Connected",
  disconnected: "Not connected",
  error: "Error",
};

export const INTEGRATION_CATEGORIES = [
  "ERP",
  "Payroll",
  "IAM",
  "Storage",
  "Communication",
  "Analytics",
] as const;

// Logs
export const LOG_SEVERITY_STYLES = {
  info: "bg-blue-100 text-blue-700",
  warn: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-700",
  success: "bg-emerald-100 text-emerald-700",
};

export const SERVICE_HEALTH_STYLES = {
  healthy: "bg-emerald-100 text-emerald-700",
  degraded: "bg-amber-100 text-amber-800",
  down: "bg-red-100 text-red-700",
};

export const SERVICE_HEALTH_LABELS = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

// Roles & Permissions
export const PERMISSION_MODULES = [
  { key: "users", label: "User Management", description: "Create, edit, suspend portal users" },
  { key: "roles", label: "Roles & Permissions", description: "Manage RBAC policies" },
  { key: "hr", label: "HR Operations", description: "Employee, recruitment, training, compliance" },
  { key: "payroll", label: "Payroll & Compensation", description: "Salary structure, payouts" },
  { key: "leave", label: "Leave & Attendance", description: "Leave approvals, attendance review" },
  { key: "performance", label: "Performance Reviews", description: "Goals, ratings, feedback" },
  { key: "analytics", label: "Analytics & KPIs", description: "Executive dashboards and reports" },
  { key: "system", label: "System Configuration", description: "Modules, workflows, defaults" },
  { key: "logs", label: "Logs & Monitoring", description: "Audit trail, system health" },
  { key: "integrations", label: "Integrations", description: "ERP, payroll, IAM connectors" },
];

export const PERMISSION_LEVEL_STYLES = {
  none: "bg-gray-100 text-gray-500",
  read: "bg-blue-100 text-blue-700",
  write: "bg-emerald-100 text-emerald-700",
  admin: "bg-violet-100 text-violet-700",
};

export const PERMISSION_LEVEL_LABELS = {
  none: "No access",
  read: "Read",
  write: "Write",
  admin: "Admin",
};

export const PERMISSION_LEVELS = ["none", "read", "write", "admin"] as const;

// System Config
export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

export const WEEK_DAYS = ["Sunday", "Monday"];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// User Management
export const USER_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  suspended: "bg-red-100 text-red-700",
};

export const USER_STATUS_LABELS = {
  active: "Active",
  pending: "Pending invite",
  suspended: "Suspended",
};

export const USER_ROLES = [
  "System Admin",
  "HR Manager",
  "HR Associate",
  "Engineering Lead",
  "Executive",
  "Designer",
  "Employee",
];

// Utility functions for dashboard
export const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

export const getGreeting = (currentTime: Date) => {
  const hour = currentTime.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getGreetingIcon = (currentTime: Date) => {
  const hour = currentTime.getHours();
  if (hour < 12) return 'Sun';
  if (hour < 17) return 'Coffee';
  return 'Moon';
};
export const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};

// Icons - resolve icon names stored in constants/sample data to components
export const ICON_MAP: Record<string, LucideIcon> = {
  CalendarPlus,
  Flower2,
  Plane,
  Laptop,
  LifeBuoy,
  PieChart,
  Receipt,
  Award,
  Baby,
  BarChart3,
  Briefcase,
  Building,
  Cake,
  Calendar,
  CalendarDays,
  CheckCheck,
  CheckCircle,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Coffee,
  FileText,
  Folder,
  Gauge,
  Gift,
  Heart,
  GraduationCap,
  HeartHandshake,
  Home,
  LineChart,
  Lock,
  Moon,
  Plug,
  Plus,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  Sun,
  Sunset,
  Target,
  Timer,
  TrendingUp,
  Upload,
  User,
  UserCog,
  Users,
  Users2,
  UtensilsCrossed,
  Wallet,
};

export const getIcon = (iconName: string, fallback: LucideIcon = CheckCircle): LucideIcon =>
  ICON_MAP[iconName] ?? fallback;

// Dashboard
export const GREETING_ICON_COLORS: Record<string, string> = {
  Sun: "text-yellow-500",
  Coffee: "text-orange-500",
  Moon: "text-blue-500",
};

export const WORKING_HOURS = {
  expectedHours: "8 hours",
  breakTime: "1 hour",
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-800",
  birthday: "bg-pink-100 text-pink-800",
  deadline: "bg-red-100 text-red-800",
};

export const CELEBRATION_STATUS_COLORS: Record<string, string> = {
  Today: "bg-yellow-100 text-yellow-800",
  upcoming: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
};

export const DEFAULT_BADGE_COLOR = "bg-gray-100 text-gray-800";

// The dashboard list scrolls, so it can hold more
export const DASHBOARD_NOTIFICATION_LIMIT = 20;

// Attendance
export const BREAK_TIMINGS = [
  { label: "Morning Break", duration: "15 mins", icon: "Coffee", cardClass: "bg-yellow-50 border-yellow-200", iconClass: "bg-yellow-100 text-yellow-600" },
  { label: "Lunch Break", duration: "1 hour", icon: "UtensilsCrossed", cardClass: "bg-green-50 border-green-200", iconClass: "bg-green-100 text-green-600" },
  { label: "Evening Break", duration: "15 mins", icon: "Sunset", cardClass: "bg-purple-50 border-purple-200", iconClass: "bg-purple-100 text-purple-600" },
];
