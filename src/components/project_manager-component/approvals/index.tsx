import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Calendar, CheckCheck, CheckCircle2, Clock, FileCheck2, Home, Inbox, MessageSquare, Receipt, Route, XCircle } from "lucide-react";
import { AppDialog } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { fieldClass } from "@/components/ui/form-fields";
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
import type { ApprovalDecision, ApprovalItem, ApprovalStatus } from "@/services/apis/approvals/approval-queue";
import { useApprovalQueue, useDecideApprovals } from "@/services/apis/approvals/use-approvals";
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
  const decide = useDecideApprovals();
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");
  // Approve / Reject open a confirmation with a comment box instead of deciding on one click; it can cover several requests
  const [pendingDecision, setPendingDecision] = useState<PendingDecision | null>(null);
  // Pending requests ticked for a bulk decision
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const byStatus = (status: ApprovalStatus) => items.filter((item) => item.status === status);
  const counts = Object.fromEntries(STATUSES.map((status) => [status.id, byStatus(status.id).length])) as Record<ApprovalStatus, number>;
  const list = byStatus(activeTab);
  // Only requests still pending and on screen count as selected
  const selectedItems = activeTab === "pending" ? list.filter((item) => selected.has(item.key)) : [];
  const allSelected = list.length > 0 && selectedItems.length === list.length;
  const toggle = (key: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const busyKeys = decide.isPending ? new Set(decide.variables?.items.map((item) => item.key)) : new Set<string>();

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

            {activeTab === "pending" && list.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = selectedItems.length > 0 && !allSelected;
                    }}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(list.map((item) => item.key)))}
                    className="h-4 w-4 rounded border-gray-300 accent-[#464EB8]"
                  />
                  {selectedItems.length ? `${selectedItems.length} selected` : "Select all"}
                </label>
                {selectedItems.length > 0 && (
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" onClick={() => setPendingDecision({ items: selectedItems, decision: "approved" })} disabled={decide.isPending} className="bg-green-600 text-white hover:bg-green-700">
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Approve {selectedItems.length}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPendingDecision({ items: selectedItems, decision: "rejected" })} disabled={decide.isPending} className="border-red-300 text-red-600 hover:bg-red-50">
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject {selectedItems.length}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {list.map((item) => (
                <RequestRow
                  key={item.key}
                  item={item}
                  busy={busyKeys.has(item.key)}
                  selected={selected.has(item.key)}
                  onToggle={activeTab === "pending" ? () => toggle(item.key) : undefined}
                  onApprove={() => setPendingDecision({ items: [item], decision: "approved" })}
                  onReject={() => setPendingDecision({ items: [item], decision: "rejected" })}
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

      <DecisionDialog
        pending={pendingDecision}
        busy={decide.isPending}
        onCancel={() => setPendingDecision(null)}
        onConfirm={(comment) =>
          pendingDecision &&
          decide.mutate(
            { ...pendingDecision, comment },
            {
              onSuccess: () => {
                setPendingDecision(null);
                setSelected(new Set());
              },
            },
          )
        }
      />
    </MainLayout>
  );
}

interface PendingDecision {
  items: ApprovalItem[];
  decision: ApprovalDecision;
}

// Confirms a decision on one or several requests; a comment is optional when approving and required when rejecting, and each requester sees it
function DecisionDialog({ pending, busy, onCancel, onConfirm }: { pending: PendingDecision | null; busy: boolean; onCancel: () => void; onConfirm: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  const [showError, setShowError] = useState(false);
  useEffect(() => {
    setComment("");
    setShowError(false);
  }, [pending]);

  const approving = pending?.decision === "approved";
  const count = pending?.items.length ?? 0;
  // One request shows its details; several show a list
  const item = count === 1 ? pending?.items[0] : undefined;
  const missing = !approving && !comment.trim();
  const confirm = () => {
    if (missing) {
      setShowError(true);
      return;
    }
    onConfirm(comment.trim());
  };

  return (
    <AppDialog
      open={!!pending}
      onOpenChange={(open) => !open && onCancel()}
      title={count > 1 ? `${approving ? "Approve" : "Reject"} ${count} requests?` : approving ? "Approve this request?" : "Reject this request?"}
      description={count > 1 ? "The same comment goes to everyone below." : item ? `${item.requesterName} · ${item.typeLabel} · ${formatDate(item.startDate)}${item.startDate !== item.endDate ? ` → ${formatDate(item.endDate)}` : ""}${item.days !== undefined ? ` · ${item.days} day${item.days === 1 ? "" : "s"}` : ""}` : undefined}
      busy={busy}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirm}
            disabled={busy}
            className={approving ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}
          >
            {busy ? "Saving…" : `${approving ? "Approve" : "Reject"}${count > 1 ? ` ${count}` : ""}`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {count > 1 && (
          <ul className="max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 text-sm">
            {pending?.items.map((entry) => (
              <li key={entry.key} className="flex justify-between gap-3 px-3 py-1.5">
                <span className="truncate font-medium text-gray-900">{entry.requesterName}</span>
                <span className="shrink-0 text-gray-500">
                  {entry.typeLabel} · {formatDate(entry.startDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {item?.reason && (
          <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="font-medium text-gray-900">Reason: </span>
            {item.reason}
          </p>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700">
            Comment {approving ? <span className="font-normal text-gray-400">(optional)</span> : <span className="text-red-600">*</span>}
          </span>
          <Textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
              setShowError(false);
            }}
            rows={3}
            maxLength={500}
            placeholder={approving ? "Add a note for them (optional)" : "Explain why, so they know what to change"}
            aria-invalid={showError && missing}
            className={fieldClass}
            autoFocus
          />
          {showError && missing && <span className="block text-xs text-red-600">Add a comment so they know why it was rejected.</span>}
          <span className="block text-xs text-gray-500">{count > 1 ? "Each of them" : (item?.requesterName ?? "They")} will see this with your decision.</span>
        </label>
      </div>
    </AppDialog>
  );
}

function RequestRow({ item, busy, selected = false, onToggle, onApprove, onReject }: { item: ApprovalItem; busy: boolean; selected?: boolean; onToggle?: () => void; onApprove: () => void; onReject: () => void }) {
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
