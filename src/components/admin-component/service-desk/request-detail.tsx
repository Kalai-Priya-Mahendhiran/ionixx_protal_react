import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Lock, MessageSquare, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { ASSET_TYPE_LABELS, DEFAULT_DESK_SETTINGS, REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS, WAITING_REASON_LABELS } from '@/lib/desk-config';
import {
  canChangeRequestStatus,
  canCommentOnRequest,
  canManageAssets,
  canManageRequests,
  canSeeInternalNotes,
  getDeskTeam,
} from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { getSlaStatus } from '@/lib/sla';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { getPriorityLabel } from '@/lib/workflow';
import {
  useAddRequestComment,
  useAssets,
  useAssignRequest,
  useChangeRequestStatus,
  useDeskSettings,
  useIssueAsset,
  useRequestActivity,
  useRequestComments,
  useRequests,
  useReturnAsset,
  useUpdateRequest,
} from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, RequestStatus, TaskPriority, WaitingReason } from '@/types';
import { AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';
import { UserChip } from '@/components/employee-component/tasks/sections/task-badges';
import { CategoryChip, RequestStatusBadge, SlaChip } from './desk-badges';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const SOURCE_LABELS: Record<AdminRequest['source'], string> = {
  manual: 'Raised in the service desk',
  onboarding: 'Created by an HR onboarding checklist',
  offboarding: 'Created by an HR offboarding checklist',
  checklist: 'Created by an HR checklist',
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="min-w-0 text-gray-900">{children}</div>
    </div>
  );
}

const selectClass = 'h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-sm';

/* ---------- Status actions ---------- */

function StatusActions({ request, user }: { request: AdminRequest; user: PermissionUser }) {
  const changeStatus = useChangeRequestStatus();
  const addComment = useAddRequestComment();
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const allowed = (to: RequestStatus) => canChangeRequestStatus(user, request, to);
  const move = (to: RequestStatus, waitingReason?: WaitingReason) => changeStatus.mutate({ id: request.id, change: { to, waitingReason } });
  const busy = changeStatus.isPending || addComment.isPending;

  const resolve = async () => {
    // The reply goes first so the requester sees what was done in the same notification thread
    if (note.trim()) await addComment.mutateAsync({ id: request.id, body: note });
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

      <Dialog open={resolving} onOpenChange={(open) => !busy && setResolving(open)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Resolve {request.key}</DialogTitle>
            <DialogDescription>
              The requester is notified and can reopen it within 7 days if something isn't right. After that it closes automatically.
            </DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="What was done? (optional, sent to the requester)" aria-label="Resolution note" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResolving(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void resolve()} disabled={busy} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              {busy ? 'Resolving…' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Conversation ---------- */

function Conversation({ request, user }: { request: AdminRequest; user: PermissionUser }) {
  const { data: comments = [], isLoading } = useRequestComments(request.id);
  const addComment = useAddRequestComment();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const canInternal = canSeeInternalNotes(user);
  const canComment = canCommentOnRequest(user, request);

  const send = () => addComment.mutate({ id: request.id, body, internal: canInternal && internal }, { onSuccess: () => setBody('') });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          Conversation
        </h2>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No replies yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className={cn('rounded-lg border p-3', comment.internal ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white')}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <UserChip userId={comment.authorId} />
                  <span title={formatDateTime(comment.createdAt)}>{formatRelativeTime(comment.createdAt)}</span>
                  {comment.internal && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                      <Lock className="h-3 w-3" />
                      Internal note
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        {canComment ? (
          <div className="space-y-2">
            {canInternal && (
              <div role="tablist" aria-label="Reply type" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-sm">
                {[
                  [false, 'Reply to requester'],
                  [true, 'Internal note'],
                ].map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    role="tab"
                    aria-selected={internal === value}
                    onClick={() => setInternal(value as boolean)}
                    className={cn('rounded-md px-3 py-1 font-medium', internal === value ? 'bg-white text-[#464EB8] shadow-sm' : 'text-gray-600')}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            )}
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder={internal ? 'Only the Admin team sees this' : canInternal ? 'The requester is notified' : 'Add details or ask a question'}
              aria-label={internal ? 'Internal note' : 'Reply'}
              className={cn(internal && 'border-amber-300 bg-amber-50/50')}
            />
            <div className="flex justify-end">
              <Button onClick={send} disabled={!body.trim() || addComment.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {addComment.isPending ? 'Sending…' : internal ? 'Add note' : 'Send'}
              </Button>
            </div>
          </div>
        ) : (
          request.status === 'closed' && <p className="text-sm text-gray-500">This request is closed. Raise a new one if you need more help.</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Assets for this person (Admin only) ---------- */

function AssetsPanel({ request }: { request: AdminRequest }) {
  const personId = request.onBehalfOfId ?? request.requesterId;
  const { data: assets = [] } = useAssets();
  const issue = useIssueAsset();
  const giveBack = useReturnAsset();
  const [assetId, setAssetId] = useState('');
  const held = assets.filter((asset) => asset.status === 'issued' && asset.assignedToId === personId);
  const inStock = assets.filter((asset) => asset.status === 'in-stock');
  const name = getUserById(personId)?.name ?? 'them';

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">Assets · {name}</h2>
        {held.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing issued to {name}.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {held.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{asset.model}</span>
                  <span className="text-xs text-gray-500">
                    {ASSET_TYPE_LABELS[asset.type]} · {asset.tag}
                  </span>
                </span>
                <Button variant="outline" size="sm" disabled={giveBack.isPending} onClick={() => giveBack.mutate({ id: asset.id, requestKey: request.key })}>
                  Mark returned
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 border-t border-gray-100 pt-3">
          <select value={assetId} onChange={(event) => setAssetId(event.target.value)} aria-label="Asset to issue" className={selectClass}>
            <option value="">Issue from stock…</option>
            {inStock.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.tag} · {asset.model}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!assetId || issue.isPending}
            onClick={() => issue.mutate({ id: assetId, userId: personId, requestKey: request.key }, { onSuccess: () => setAssetId('') })}
            className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
          >
            Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Page ---------- */

function RequestDetailContent({ user }: { user: PermissionUser }) {
  const { requestKey = '' } = useParams();
  const { data: requests = [], isLoading, isError, refetch } = useRequests();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const request = requests.find((item) => item.key.toLowerCase() === requestKey.toLowerCase());
  const { data: activity = [] } = useRequestActivity(request?.id);
  const assign = useAssignRequest();
  const update = useUpdateRequest();
  const isDesk = canManageRequests(user);
  const backLabel = isDesk ? 'Back to the queue' : 'Back to My Requests';

  if (isLoading) return <div className="h-96 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Loading request" />;
  if (isError)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        Couldn't load this request.{' '}
        <button type="button" onClick={() => refetch()} className="font-medium underline">
          Try again
        </button>
      </div>
    );
  if (!request)
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <SearchX className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h1 className="mb-2 text-lg font-medium text-gray-900">{requestKey.toUpperCase()} isn't available</h1>
          <p className="mb-4 text-gray-600">It may not exist, or it isn't one of your requests.</p>
          <Button asChild variant="outline">
            <Link to={ROUTES.ServiceDesk}>{backLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    );

  const sla = getSlaStatus(request, settings.sla[request.category]);
  const open = request.status !== 'resolved' && request.status !== 'closed';

  return (
    <div className="space-y-6">
      <Link to={ROUTES.ServiceDesk} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#464EB8]">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className={cn('flex flex-wrap items-start justify-between gap-4 rounded-xl', sla.breached && open && 'border border-red-200 bg-red-50 p-4')}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">{request.key}</span>
            <RequestStatusBadge request={request} />
            {sla.breached && open && <SlaChip clock={sla.resolution.state === 'breached' ? sla.resolution : sla.response} label="SLA" compact />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
        </div>
        <StatusActions request={request} user={user} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-base font-semibold text-gray-900">Details</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{request.description || 'No details given.'}</p>
              <AttachmentList attachments={request.attachments} />
            </CardContent>
          </Card>
          <Conversation request={request} user={user} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardContent className="divide-y divide-gray-100 p-5">
              <Row label="Category">
                {isDesk && open ? (
                  <select value={request.category} onChange={(event) => update.mutate({ id: request.id, changes: { category: event.target.value as AdminRequest['category'] } })} aria-label="Category" className={selectClass}>
                    {REQUEST_CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {REQUEST_CATEGORY_LABELS[value]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <CategoryChip category={request.category} />
                )}
              </Row>
              <Row label="Priority">
                {isDesk && open ? (
                  <select value={request.priority} onChange={(event) => update.mutate({ id: request.id, changes: { priority: event.target.value as TaskPriority } })} aria-label="Priority" className={selectClass}>
                    {PRIORITIES.map((value) => (
                      <option key={value} value={value}>
                        {getPriorityLabel(value)}
                      </option>
                    ))}
                  </select>
                ) : (
                  getPriorityLabel(request.priority)
                )}
              </Row>
              <Row label="Assignee">
                {isDesk && request.status !== 'closed' ? (
                  <select value={request.assigneeId ?? ''} onChange={(event) => assign.mutate({ id: request.id, assigneeId: event.target.value || undefined })} aria-label="Assignee" className={selectClass}>
                    <option value="">Unassigned</option>
                    {getDeskTeam().map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.id === user.id ? `${member.name} (me)` : member.name}
                      </option>
                    ))}
                  </select>
                ) : request.assigneeId ? (
                  <UserChip userId={request.assigneeId} />
                ) : (
                  <span className="text-gray-500">Not picked up yet</span>
                )}
              </Row>
              <Row label="Requester">
                <UserChip userId={request.requesterId} />
              </Row>
              {request.onBehalfOfId && (
                <Row label="For">
                  <UserChip userId={request.onBehalfOfId} />
                </Row>
              )}
              <Row label="Raised">
                <span title={formatDateTime(request.createdAt)}>{formatRelativeTime(request.createdAt)}</span>
              </Row>
              <Row label="Source">
                <span className="text-sm text-gray-700">{SOURCE_LABELS[request.source]}</span>
              </Row>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-base font-semibold text-gray-900">SLA</h2>
              {(
                [
                  ['First response', sla.response],
                  ['Resolution', sla.resolution],
                ] as const
              ).map(([label, clock]) => (
                <div key={label} className="space-y-1">
                  <p className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-xs text-gray-500">target {Math.round((clock.targetMs / 3600000) * 10) / 10}h</span>
                  </p>
                  <SlaChip clock={clock} />
                  {!clock.stoppedAt && clock.state !== 'breached' && <p className="text-xs text-gray-500">Due {formatDateTime(clock.dueAt)}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          {canManageAssets(user) && request.category === 'asset' && <AssetsPanel request={request} />}

          <Card>
            <CardContent className="space-y-3 p-5">
              <h2 className="text-base font-semibold text-gray-900">History</h2>
              {activity.length === 0 ? (
                <p className="text-sm text-gray-500">No changes yet.</p>
              ) : (
                <ol className="space-y-2 text-sm">
                  {activity.map((entry) => (
                    <li key={entry.id} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="font-medium text-gray-900">{entry.actorId === 'system' ? 'Automation' : (getUserById(entry.actorId)?.name ?? 'Someone')}</span>{' '}
                        <span className="text-gray-700">{entry.summary.charAt(0).toLowerCase() + entry.summary.slice(1)}</span>
                        <span className="block text-xs text-gray-500" title={formatDateTime(entry.createdAt)}>
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function RequestDetail() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl">
        <RequestDetailContent user={user} />
      </div>
    </MainLayout>
  );
}
