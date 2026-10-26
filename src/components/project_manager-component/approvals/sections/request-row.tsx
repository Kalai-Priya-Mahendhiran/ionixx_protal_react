import type { ReactNode } from "react";
import { Calendar, CheckCircle2, Clock, FileCheck2, Home, MessageSquare, Receipt, Route, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/org-chart";
import { formatINR } from "@/lib/payroll";
import type { ApprovalItem } from "@/services/apis/approvals/approval-queue";
import { formatDate, kindColor } from "./approvals-meta";

const KIND_ICON: Record<string, ReactNode> = {
  leave: <Calendar className="h-4 w-4" />,
  "time-off": <Clock className="h-4 w-4" />,
  wfh: <Home className="h-4 w-4" />,
  declaration: <FileCheck2 className="h-4 w-4" />,
};

export function RequestRow({ item, busy, selected = false, onToggle, onApprove, onReject }: { item: ApprovalItem; busy: boolean; selected?: boolean; onToggle?: () => void; onApprove: () => void; onReject: () => void }) {
  return (
    <div className={`rounded-lg border p-4 transition-all hover:border-[#464EB8]/40 hover:shadow-sm ${selected ? "border-[#464EB8]/50 bg-indigo-50/40" : "border-gray-200"}`}>
      <div className="flex items-start gap-4">
        {onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${item.requesterName}'s ${item.typeLabel.toLowerCase()}`}
            className="mt-3.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-[#464EB8]"
          />
        )}
        <Avatar className="h-11 w-11">
          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 font-semibold text-white">{initials(item.requesterName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-900">{item.requesterName}</p>
            {item.requesterDesignation && <span className="text-xs text-gray-500">· {item.requesterDesignation}</span>}
            <Badge className={kindColor(item.kind)}>
              <span className="flex items-center gap-1">
                {KIND_ICON[item.kind] ?? <Receipt className="h-4 w-4" />}
                <span>{item.typeLabel}</span>
              </span>
            </Badge>
          </div>
          <p className="text-sm text-gray-700">
            {formatDate(item.startDate)}
            {item.startDate !== item.endDate && <> → {formatDate(item.endDate)}</>}
            {item.amount !== undefined && (
              <>
                <span className="text-gray-400"> · </span>
                <span className="font-medium">{formatINR(item.amount)}</span>
              </>
            )}
            {item.days !== undefined && (
              <>
                <span className="text-gray-400"> · </span>
                <span className="font-medium">
                  {item.days} day{item.days === 1 ? "" : "s"}
                </span>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-gray-600">{item.reason}</p>
          {item.routeNote && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-700">
              <Route className="h-3.5 w-3.5" aria-hidden="true" />
              {item.routeNote}
            </p>
          )}
          {item.decisionComment && (
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-700">
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
              <span>“{item.decisionComment}”</span>
            </p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Applied {formatDate(item.appliedDate)}
            {item.decidedBy && item.decidedDate && (
              <>
                {" "}
                · {item.status === "approved" ? "Approved" : "Rejected"} by {item.decidedBy} on {formatDate(item.decidedDate)}
              </>
            )}
          </p>
        </div>
        {item.status === "pending" ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button size="sm" onClick={onApprove} disabled={busy} className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="border-red-300 text-red-600 hover:bg-red-50">
              <XCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>
          </div>
        ) : (
          <Badge className={item.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{item.status === "approved" ? "Approved" : "Rejected"}</Badge>
        )}
      </div>
    </div>
  );
}
