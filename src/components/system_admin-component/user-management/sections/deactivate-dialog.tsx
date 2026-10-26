import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppDialog, destructiveButtonClass } from "@/components/ui/form-dialog";
import { getActiveUsers } from "@/lib/user-directory";
import { useDeactivateUser, useOpenWork } from "@/services/apis/users/use-user-access";
import type { UserAccount } from "@/types";
import { fieldClass } from "./user-management-utils";

/* ---------- Deactivate ---------- */

export function DeactivateDialog({ account, onClose }: { account: UserAccount; onClose: () => void }) {
  const { data: openWork, isLoading } = useOpenWork(account.id);
  const deactivate = useDeactivateUser();
  const [reassignToId, setReassignToId] = useState("");
  const candidates = useMemo(() => getActiveUsers().filter((person) => person.id !== account.id).sort((a, b) => a.name.localeCompare(b.name)), [account.id]);
  const hasTasks = !!openWork && openWork.tasks > 0;

  return (
    <AppDialog
      open
      onOpenChange={(next) => !next && onClose()}
      busy={deactivate.isPending}
      title={`Deactivate ${account.name}?`}
      description="They won't be able to sign in and won't appear in any picker. Their history stays, and you can reactivate them later."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deactivate.isPending}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || deactivate.isPending}
            onClick={() => deactivate.mutate({ userId: account.id, reassignToId: reassignToId || undefined }, { onSuccess: onClose })}
            className={destructiveButtonClass}
          >
            {deactivate.isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Open work: <b>{openWork?.tasks ?? 0}</b> {openWork?.tasks === 1 ? "task" : "tasks"}
            {!!openWork?.requests && (
              <>
                , <b>{openWork.requests}</b> Admin {openWork.requests === 1 ? "request" : "requests"} (these go back to the queue)
              </>
            )}
          </p>
          {hasTasks && (
            <label className="block space-y-1">
              <span className="text-gray-700">Hand their open tasks to</span>
              <select value={reassignToId} onChange={(event) => setReassignToId(event.target.value)} className={fieldClass}>
                <option value="">Leave them assigned (reassign later)</option>
                {candidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.designation}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </AppDialog>
  );
}
