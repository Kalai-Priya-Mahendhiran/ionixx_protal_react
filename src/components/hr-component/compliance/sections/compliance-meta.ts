export type Tab = "documents" | "status" | "audit";

// What a stat card narrows its tab to (Documents and Audit Entries show their whole tab)
export type CardFilter = "compliant" | "action";

export type DocStatus = "valid" | "expiring" | "expired" | "missing";

export interface ComplianceDocument {
  id: string;
  name: string;
  category: string;
  uploadedBy: string;
  uploadedDate: string;
  expiryDate: string | null;
  status: DocStatus;
  size: string;
}

export interface EmployeeCompliance {
  employeeId: string;
  employeeName: string;
  department: string;
  required: number;
  submitted: number;
  pending: string[];
  status: "compliant" | "partial" | "non-compliant";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  type: "upload" | "update" | "review" | "delete" | "assign";
}

// What the Upload Document dialog hands back; the page fills in the rest
export type NewComplianceDocument = Pick<ComplianceDocument, "name" | "category" | "expiryDate">;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  const d = new Date(value);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
