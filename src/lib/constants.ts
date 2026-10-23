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
};

export const TEAM_MEMBER_STATUS_LABELS = {
  active: "In office",
  "on-leave": "On leave",
  remote: "Remote",
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
