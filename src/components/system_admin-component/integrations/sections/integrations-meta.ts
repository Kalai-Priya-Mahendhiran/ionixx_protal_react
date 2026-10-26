import {
  Database,
  Wallet,
  ShieldCheck,
  Boxes,
  Cloud,
  Mail,
} from "lucide-react";

export type IntegrationStatus = "connected" | "disconnected" | "error";
export type Category = "ERP" | "Payroll" | "IAM" | "Storage" | "Communication" | "Analytics";

export interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  status: IntegrationStatus;
  description: string;
  endpoint: string;
  lastSync: string | null;
  recordsSynced: number;
  apiKey: string;
  webhookUrl?: string;
  icon: typeof Database;
}

export const seedIntegrations: Integration[] = [
  {
    id: "INT-001",
    name: "SAP ERP",
    vendor: "SAP",
    category: "ERP",
    status: "connected",
    description: "Master employee and cost-center sync.",
    endpoint: "https://erp.company.com/api/v2",
    lastSync: "2026-05-08T08:30:00",
    recordsSynced: 142,
    apiKey: "sk_erp_••••••••8f2a",
    webhookUrl: "https://portal.company.com/hooks/erp",
    icon: Database,
  },
  {
    id: "INT-002",
    name: "Payroll Vendor",
    vendor: "ADP",
    category: "Payroll",
    status: "connected",
    description: "Monthly payroll processing and payslips.",
    endpoint: "https://api.adp.com/payroll/v3",
    lastSync: "2026-05-08T08:30:00",
    recordsSynced: 142,
    apiKey: "sk_adp_••••••••a1c4",
    icon: Wallet,
  },
  {
    id: "INT-003",
    name: "IAM Provider",
    vendor: "Okta",
    category: "IAM",
    status: "error",
    description: "SSO and lifecycle for portal users.",
    endpoint: "https://company.okta.com/oauth2/default",
    lastSync: "2026-05-07T21:02:33",
    recordsSynced: 0,
    apiKey: "sk_okta_••••••••3d77",
    webhookUrl: "https://portal.company.com/hooks/okta",
    icon: ShieldCheck,
  },
  {
    id: "INT-004",
    name: "Object Storage",
    vendor: "AWS S3",
    category: "Storage",
    status: "connected",
    description: "Document and attachment storage.",
    endpoint: "https://s3.ap-south-1.amazonaws.com",
    lastSync: "2026-05-08T09:15:00",
    recordsSynced: 8421,
    apiKey: "sk_aws_••••••••c2e9",
    icon: Cloud,
  },
  {
    id: "INT-005",
    name: "Email & SMTP",
    vendor: "SendGrid",
    category: "Communication",
    status: "connected",
    description: "Transactional and bulk email delivery.",
    endpoint: "https://api.sendgrid.com/v3",
    lastSync: "2026-05-08T09:32:11",
    recordsSynced: 3142,
    apiKey: "sk_sg_••••••••5b18",
    icon: Mail,
  },
  {
    id: "INT-006",
    name: "BI Warehouse",
    vendor: "Snowflake",
    category: "Analytics",
    status: "disconnected",
    description: "Mirror data for executive analytics.",
    endpoint: "https://company.snowflakecomputing.com",
    lastSync: null,
    recordsSynced: 0,
    apiKey: "",
    icon: Boxes,
  },
];

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
