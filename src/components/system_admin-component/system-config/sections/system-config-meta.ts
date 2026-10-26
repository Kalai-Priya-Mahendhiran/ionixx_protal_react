export type TabKey = "modules" | "workflows" | "defaults";

export interface ModuleToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "Core" | "Operations" | "Insights";
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  updatedOn: string;
}

export interface DefaultsState {
  organizationName: string;
  primaryDomain: string;
  supportEmail: string;
  defaultTimezone: string;
  workWeekStart: string;
  fiscalYearStart: string;
  sessionTimeout: number;
  passwordExpiry: number;
}

export const initialModules: ModuleToggle[] = [
  {
    key: "users",
    label: "User Management",
    description: "Provision and govern portal accounts.",
    enabled: true,
    category: "Core",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    description: "Role-based access control policies.",
    enabled: true,
    category: "Core",
  },
  {
    key: "hr",
    label: "HR Operations",
    description: "Recruitment, onboarding, training.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "payroll",
    label: "Payroll & Compensation",
    description: "Run payroll cycles and manage compensation.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "leave",
    label: "Leave & Attendance",
    description: "Time-off requests and attendance tracking.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "performance",
    label: "Performance Reviews",
    description: "Goals, ratings, 360° feedback cycles.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "analytics",
    label: "Analytics & KPIs",
    description: "Executive dashboards and trend reports.",
    enabled: true,
    category: "Insights",
  },
  {
    key: "logs",
    label: "Logs & Monitoring",
    description: "Audit trail, alerting, system health.",
    enabled: true,
    category: "Insights",
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "External ERP, payroll, IAM connectors.",
    enabled: false,
    category: "Insights",
  },
];

export const initialWorkflows: WorkflowRule[] = [
  {
    id: "WFL-001",
    name: "Auto-approve casual leave under 2 days",
    trigger: "Leave request submitted (Casual, ≤ 2 days)",
    action: "Approve automatically and notify reporting manager",
    enabled: true,
    updatedOn: "2026-04-14",
  },
  {
    id: "WFL-002",
    name: "Escalate pending offers after 5 days",
    trigger: "Offer status = Pending for 5+ days",
    action: "Notify HR Manager and Talent Lead",
    enabled: true,
    updatedOn: "2026-03-29",
  },
  {
    id: "WFL-003",
    name: "Onboarding checklist on hire",
    trigger: "New employee record created",
    action: "Assign onboarding tasks and welcome email",
    enabled: true,
    updatedOn: "2026-02-08",
  },
  {
    id: "WFL-004",
    name: "Quarterly performance review reminder",
    trigger: "Quarter end -7 days",
    action: "Notify managers to complete reviews",
    enabled: false,
    updatedOn: "2026-01-22",
  },
  {
    id: "WFL-005",
    name: "Suspend inactive users after 90 days",
    trigger: "User last login > 90 days",
    action: "Move user to suspended status",
    enabled: true,
    updatedOn: "2025-11-30",
  },
];

export const initialDefaults: DefaultsState = {
  organizationName: "Knowledge & People Self-Service",
  primaryDomain: "company.com",
  supportEmail: "support@company.com",
  defaultTimezone: "Asia/Kolkata",
  workWeekStart: "Monday",
  fiscalYearStart: "April",
  sessionTimeout: 30,
  passwordExpiry: 90,
};

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
