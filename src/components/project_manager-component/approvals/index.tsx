import { useState, type ReactNode } from "react";
import { AlertCircle, Calendar, CheckCheck, CheckCircle2, Clock, FileCheck2, Home, Inbox, Receipt, XCircle } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { APPROVAL_TYPE_COLORS } from "@/lib/constants";
import { initials } from "@/lib/org-chart";
import { formatINR } from "@/lib/payroll";
import type { ApprovalItem, ApprovalStatus } from "@/services/apis/approvals/approval-queue";
import { useApprovalQueue, useDecideApproval } from "@/services/apis/approvals/use-approvals";
import { PageTabs } from "@/components/ui/page-tabs";

/*
 * Requests waiting on the signed-in person: leave, work from home, time off, claims, tax proofs… from every registered source.
 * The queue is live, so a request an employee submits shows up here, and a decision reaches their Leave Tracker.
 */

const STATUSES: { id: ApprovalStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const KIND_ICON: Record<string, ReactNode> = {
  leave: <Calendar className="h-4 w-4" />,
  "time-off": <Clock className="h-4 w-4" />,
  wfh: <Home className="h-4 w-4" />,
  declaration: <FileCheck2 className="h-4 w-4" />,
};

const kindColor = (kind: string) => APPROVAL_TYPE_COLORS[kind as keyof typeof APPROVAL_TYPE_COLORS] ?? "bg-gray-100 text-gray-800";

export default function Approvals() {
  const { data: items = [], isLoading } = useApprovalQueue();
  const decide = useDecideApproval();
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");

  const byStatus = (status: ApprovalStatus) => items.filter((item) => item.status === status);
  const counts = Object.fromEntries(STATUSES.map((status) => [status.id, byStatus(status.id).length])) as Record<ApprovalStatus, number>;
  const list = byStatus(activeTab);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader icon={CheckCheck} title="Approvals" description={`${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected`} />

        <StatGrid>
          {/* The cards are the same filter as the tabs below (the queue has no "All" view) */}
          <StatCard icon={AlertCircle} label="Pending" value={counts.pending} tone="amber" loading={isLoading} active={activeTab === "pending"} onClick={() => setActiveTab("pending")} />
          <StatCard icon={CheckCircle2} label="Approved" value={counts.approved} tone="green" loading={isLoading} active={activeTab === "approved"} onClick={() => setActiveTab("approved")} />
          <StatCard icon={XCircle} label="Rejected" value={counts.rejected} tone="red" loading={isLoading} active={activeTab === "rejected"} onClick={() => setActiveTab("rejected")} />
        </StatGrid>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-[#464EB8]" />
              <span>Request Queue</span>
            </CardTitle>
            <CardDescription>Requests waiting on you: your team's leave and work requests, and claims or proofs if you review payroll. Your decision is sent to them straight away.</CardDescription>
          </CardHeader>
          <CardContent>
            <PageTabs className="mb-4" label="Request status" tabs={STATUSES.map((status) => ({ ...status, count: counts[status.id] }))} value={activeTab} onChange={setActiveTab} />

            <div className="space-y-3">
              {list.map((item) => (
                <RequestRow
                  key={item.key}
                  item={item}
                  busy={decide.isPending && decide.variables?.item.key === item.key}
                  onApprove={() => decide.mutate({ item, decision: "approved" })}
                  onReject={() => decide.mutate({ item, decision: "rejected" })}
                />
              ))}
              {!isLoading && list.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-gray-500">
                  <Inbox className="h-8 w-8 text-gray-300" aria-hidden="true" />
                  {activeTab === "pending" ? "Nothing waiting for you. New requests from your team will appear here." : `No ${activeTab} requests yet.`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function RequestRow({ item, busy, onApprove, onReject }: { item: ApprovalItem; busy: boolean; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 transition-all hover:border-[#464EB8]/40 hover:shadow-sm">
      <div className="flex items-start gap-4">
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
