import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FormDialog } from '@/components/ui/form-dialog';
import { TextareaField } from '@/components/ui/form-fields';
import { WAITING_REASON_LABELS } from '@/lib/desk-config';
import { resolveRequestSchema, type ResolveRequestFormValues } from '@/lib/form-schemas/desk';
import { canChangeRequestStatus } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { useAddRequestComment, useChangeRequestStatus } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, RequestStatus, WaitingReason } from '@/types';

export function StatusActionsSection({ request, user }: { request: AdminRequest; user: PermissionUser }) {
  const changeStatus = useChangeRequestStatus();
  const addComment = useAddRequestComment();
  const [resolving, setResolving] = useState(false);
  const resolveForm = useForm<ResolveRequestFormValues>({ resolver: zodResolver(resolveRequestSchema), defaultValues: { note: '' } });
  const allowed = (to: RequestStatus) => canChangeRequestStatus(user, request, to);
  const move = (to: RequestStatus, waitingReason?: WaitingReason) => changeStatus.mutate({ id: request.id, change: { to, waitingReason } });
  const busy = changeStatus.isPending || addComment.isPending;

  useEffect(() => {
    if (resolving) resolveForm.reset({ note: '' });
  }, [resolving, resolveForm]);

  const resolve = async ({ note }: ResolveRequestFormValues) => {
    // The reply goes first so the requester sees what was done in the same notification thread
    if (note) await addComment.mutateAsync({ id: request.id, body: note });
    changeStatus.mutate({ id: request.id, change: { to: 'resolved' } }, { onSuccess: () => setResolving(false) });
  };

  const startLabel = request.status === 'resolved' ? 'Reopen' : request.status === 'waiting' ? 'Resume work' : 'Start work';
  if (!(['in-progress', 'waiting', 'resolved', 'closed'] as RequestStatus[]).some(allowed)) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {allowed('in-progress') && (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => move('in-progress')}>
          {startLabel}
        </Button>
      )}
      {allowed('waiting') && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={busy} className="gap-1">
              Waiting
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            {(Object.keys(WAITING_REASON_LABELS) as WaitingReason[]).map((reason) => (
              <DropdownMenuItem key={reason} onSelect={() => move('waiting', reason)}>
                {WAITING_REASON_LABELS[reason]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {allowed('resolved') && (
        <Button size="sm" disabled={busy} onClick={() => setResolving(true)} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
          Resolve
        </Button>
      )}
      {allowed('closed') && (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => move('closed')}>
          Close
        </Button>
      )}

      <FormDialog
        open={resolving}
        onOpenChange={setResolving}
        form={resolveForm}
        onSubmit={resolve}
        title={`Resolve ${request.key}`}
        description="The requester is notified and can reopen it within 7 days if something isn't right. After that it closes automatically."
        submitLabel="Resolve"
        pendingLabel="Resolving…"
        pending={busy}
        hideRequiredNote
      >
        <TextareaField control={resolveForm.control} name="note" label="Resolution note" rows={3} placeholder="What was done? (optional, sent to the requester)" />
      </FormDialog>
    </div>
  );
}
