import { APPROVAL_TYPE_COLORS } from "@/lib/constants";
import type { ApprovalDecision, ApprovalItem, ApprovalStatus } from "@/services/apis/approvals/approval-queue";

export const STATUSES: { id: ApprovalStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

export const kindColor = (kind: string) => APPROVAL_TYPE_COLORS[kind as keyof typeof APPROVAL_TYPE_COLORS] ?? "bg-gray-100 text-gray-800";

export interface PendingDecision {
  items: ApprovalItem[];
  decision: ApprovalDecision;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
