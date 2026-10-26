import { useEffect, useState } from "react";
import { AppDialog } from "@/components/ui/form-dialog";
import { Textarea } from "@/components/ui/textarea";
import { fieldClass } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { formatDate, type PendingDecision } from "./approvals-meta";

// Confirms a decision on one or several requests; a comment is optional when approving and required when rejecting, and each requester sees it
export function DecisionDialog({ pending, busy, onCancel, onConfirm }: { pending: PendingDecision | null; busy: boolean; onCancel: () => void; onConfirm: (comment: string) => void }) {
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
