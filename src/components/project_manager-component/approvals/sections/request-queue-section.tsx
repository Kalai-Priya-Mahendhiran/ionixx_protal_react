import { CheckCheck, CheckCircle2, Inbox, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTabs } from "@/components/common-component/tabs";
import type { ApprovalItem, ApprovalStatus } from "@/services/apis/approvals/approval-queue";
import { STATUSES, type PendingDecision } from "./approvals-meta";
import { RequestRow } from "./request-row";

interface RequestQueueSectionProps {
  activeTab: ApprovalStatus;
  onTabChange: (status: ApprovalStatus) => void;
  counts: Record<ApprovalStatus, number>;
  // Requests in the active tab
  list: ApprovalItem[];
  isLoading: boolean;
  selected: Set<string>;
  selectedItems: ApprovalItem[];
  allSelected: boolean;
  onSelectedChange: (selected: Set<string>) => void;
  onToggle: (key: string) => void;
  busyKeys: Set<string>;
  deciding: boolean;
  onDecide: (pending: PendingDecision) => void;
}

export function RequestQueueSection({ activeTab, onTabChange, counts, list, isLoading, selected, selectedItems, allSelected, onSelectedChange, onToggle, busyKeys, deciding, onDecide }: RequestQueueSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCheck className="h-5 w-5 text-[#464EB8]" />
          <span>Request Queue</span>
        </CardTitle>
        <CardDescription>Requests waiting on you: your team's leave and work requests, and claims or proofs if you review payroll. Your decision is sent to them straight away.</CardDescription>
      </CardHeader>
      <CardContent>
        <PageTabs className="mb-4" label="Request status" tabs={STATUSES.map((status) => ({ ...status, count: counts[status.id] }))} value={activeTab} onChange={onTabChange} />

        {activeTab === "pending" && list.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = selectedItems.length > 0 && !allSelected;
                }}
                onChange={() => onSelectedChange(allSelected ? new Set() : new Set(list.map((item) => item.key)))}
                className="h-4 w-4 rounded border-gray-300 accent-[#464EB8]"
              />
              {selectedItems.length ? `${selectedItems.length} selected` : "Select all"}
            </label>
            {selectedItems.length > 0 && (
              <div className="ml-auto flex gap-2">
                <Button size="sm" onClick={() => onDecide({ items: selectedItems, decision: "approved" })} disabled={deciding} className="bg-green-600 text-white hover:bg-green-700">
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve {selectedItems.length}
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDecide({ items: selectedItems, decision: "rejected" })} disabled={deciding} className="border-red-300 text-red-600 hover:bg-red-50">
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
              onToggle={activeTab === "pending" ? () => onToggle(item.key) : undefined}
              onApprove={() => onDecide({ items: [item], decision: "approved" })}
              onReject={() => onDecide({ items: [item], decision: "rejected" })}
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
  );
}
