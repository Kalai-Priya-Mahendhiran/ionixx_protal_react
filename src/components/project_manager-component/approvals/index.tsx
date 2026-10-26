import { useState } from "react";
import { AlertCircle, CheckCheck, CheckCircle2, XCircle } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import type { ApprovalStatus } from "@/services/apis/approvals/approval-queue";
import { useApprovalQueue, useDecideApprovals } from "@/services/apis/approvals/use-approvals";
import { DecisionDialog, RequestQueueSection } from "./sections";
import { STATUSES, type PendingDecision } from "./sections/approvals-meta";

/*
 * Requests waiting on the signed-in person: leave, work from home, time off, claims, tax proofs… from every registered source.
 * The queue is live, so a request an employee submits shows up here, and a decision reaches their Leave Tracker.
 */

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

        <RequestQueueSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          list={list}
          isLoading={isLoading}
          selected={selected}
          selectedItems={selectedItems}
          allSelected={allSelected}
          onSelectedChange={setSelected}
          onToggle={toggle}
          busyKeys={busyKeys}
          deciding={decide.isPending}
          onDecide={setPendingDecision}
        />
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
