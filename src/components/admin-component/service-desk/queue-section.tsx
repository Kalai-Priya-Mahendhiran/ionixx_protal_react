import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Inbox, Search, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import { REQUEST_CATEGORY_LABELS, type Desk } from '@/lib/desk-config';
import { getDeskTeam } from '@/lib/permissions/desk-permissions';
import { getSlaStatus, type SlaStatus } from '@/lib/sla';
import { getUserById } from '@/lib/user-directory';
import { cn, formatRelativeTime } from '@/lib/utils';
import { getPriorityLabel } from '@/lib/workflow';
import { useAssignRequest } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, DeskSettings, RequestCategory, TaskPriority } from '@/types';
import { PriorityIndicator } from '@/components/employee-component/tasks/sections/task-badges';
import { CategoryChip, RequestStatusBadge, SlaChip } from './desk-badges';
import { requestPath } from './desk-links';

export type QueueView = 'open' | 'unassigned' | 'mine' | 'breached' | 'at-risk' | 'done';

const VIEWS: { value: QueueView; label: string }[] = [
  { value: 'open', label: 'All open' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'breached', label: 'SLA breached' },
  { value: 'done', label: 'Resolved & closed' },
];

const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
const isDone = (request: AdminRequest) => request.status === 'resolved' || request.status === 'closed';

// The clock that matters now: response until someone responds, then resolution
const activeClock = (sla: SlaStatus, request: AdminRequest) => (request.firstResponseAt || isDone(request) ? sla.resolution : sla.response);

export function QueueSection({ requests, desks, settings, userId, isLoading }: { requests: AdminRequest[]; desks: Desk[]; settings: DeskSettings; userId: string; isLoading: boolean }) {
  const categories = desks.flatMap((desk) => desk.categories);
  const [params, setParams] = useSearchParams();
  const view = ([...VIEWS.map((option) => option.value), 'at-risk'].includes(params.get('view') ?? '') ? params.get('view') : 'open') as QueueView;
  const category = (categories as string[]).includes(params.get('category') ?? '') ? (params.get('category') as RequestCategory) : '';
  const priority = (PRIORITIES as string[]).includes(params.get('priority') ?? '') ? (params.get('priority') as TaskPriority) : '';
  const assignee = params.get('assignee') ?? '';
  const search = params.get('q') ?? '';
  const assign = useAssignRequest();
  const team = desks.flatMap((desk) => getDeskTeam(desk.id));

  const setParam = (key: string, value: string) =>
    setParams(
      (current) => {
        if (value) current.set(key, value);
        else current.delete(key);
        return current;
      },
      { replace: true },
    );

  const rows = useMemo(() => {
    const now = new Date();
    return requests.map((request) => ({ request, sla: getSlaStatus(request, settings.sla[request.category], now) }));
  }, [requests, settings]);

  const isAtRisk = ({ request, sla }: (typeof rows)[number]) => !isDone(request) && !sla.breached && [sla.response, sla.resolution].some((clock) => clock.state === 'at-risk');
  const counts = {
    open: rows.filter(({ request }) => !isDone(request)).length,
    unassigned: rows.filter(({ request }) => !isDone(request) && !request.assigneeId).length,
    breached: rows.filter(({ request, sla }) => !isDone(request) && sla.breached).length,
    atRisk: rows.filter(isAtRisk).length,
    mine: rows.filter(({ request }) => !isDone(request) && request.assigneeId === userId).length,
  };

  const query = search.trim().toLowerCase();
  const shown = rows
    .filter(({ request, sla }) => {
      switch (view) {
        case 'unassigned':
          return !isDone(request) && !request.assigneeId;
        case 'mine':
          return !isDone(request) && request.assigneeId === userId;
        case 'breached':
          return sla.breached;
        case 'at-risk':
          return isAtRisk({ request, sla });
        case 'done':
          return isDone(request);
        default:
          return !isDone(request);
      }
    })
    .filter(({ request }) => (!category || request.category === category) && (!priority || request.priority === priority) && (!assignee || (assignee === 'none' ? !request.assigneeId : request.assigneeId === assignee)))
    .filter(({ request }) => !query || [request.key, request.title, getUserById(request.requesterId)?.name ?? '', getUserById(request.onBehalfOfId)?.name ?? ''].some((text) => text.toLowerCase().includes(query)))
    // Open work: closest to (or furthest past) its deadline first; finished work: newest first
    .sort((a, b) =>
      view === 'done'
        ? (b.request.resolvedAt ?? b.request.createdAt).localeCompare(a.request.resolvedAt ?? a.request.createdAt)
        : activeClock(a.sla, a.request).remainingMs - activeClock(b.sla, b.request).remainingMs,
    );

  const filtered = !!(category || priority || assignee || query);

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard icon={Inbox} label="Open" value={counts.open} tone="gray" loading={isLoading} active={view === 'open'} onClick={() => setParam('view', '')} />
        <StatCard icon={UserX} label="Unassigned" value={counts.unassigned} tone="gray" loading={isLoading} active={view === 'unassigned'} onClick={() => setParam('view', 'unassigned')} />
        <StatCard icon={AlertTriangle} label="SLA breached" value={counts.breached} tone="red" loading={isLoading} active={view === 'breached'} onClick={() => setParam('view', 'breached')} />
        <StatCard icon={AlertTriangle} label="At risk" value={counts.atRisk} tone="amber" loading={isLoading} active={view === 'at-risk'} onClick={() => setParam('view', 'at-risk')} />
      </StatGrid>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div role="group" aria-label="Queue views" className="flex flex-wrap gap-2">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => setParam('view', option.value === 'open' ? '' : option.value)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
                  view === option.value ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-[#464EB8]/40 hover:text-[#464EB8]',
                )}
              >
                {option.label}
                {option.value !== 'done' && (
                  <span className={cn('rounded-full px-1.5 text-xs', view === option.value ? 'bg-white/20' : 'bg-gray-100 text-gray-600')}>
                    {option.value === 'open' ? counts.open : option.value === 'unassigned' ? counts.unassigned : option.value === 'mine' ? counts.mine : counts.breached}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setParam('q', event.target.value)}
                placeholder="Search key, summary or person…"
                aria-label="Search requests"
                className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </div>
            <select value={category} onChange={(event) => setParam('category', event.target.value)} aria-label="Category" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {REQUEST_CATEGORY_LABELS[value]}
                </option>
              ))}
            </select>
            <select value={priority} onChange={(event) => setParam('priority', event.target.value)} aria-label="Priority" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">All priorities</option>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {getPriorityLabel(value)}
                </option>
              ))}
            </select>
            <select value={assignee} onChange={(event) => setParam('assignee', event.target.value)} aria-label="Assignee" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">Anyone</option>
              <option value="none">Unassigned</option>
              {team.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Loading requests" />
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" aria-hidden="true" />
          {filtered ? 'No requests match these filters.' : view === 'breached' ? 'No SLA breaches. Nice work.' : view === 'at-risk' ? 'Nothing is close to breaching.' : view === 'done' ? 'Nothing resolved yet.' : 'The queue is clear.'}
        </div>
      ) : (
        <div className="app-scrollbar relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2">Request</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Requester</th>
                <th className="px-3 py-2">Assignee</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shown.map(({ request, sla }) => {
                const clock = activeClock(sla, request);
                return (
                  <tr key={request.id} className={cn('align-top hover:bg-indigo-50/40', sla.breached && !isDone(request) && 'bg-red-50/60 hover:bg-red-50')}>
                    <td className="max-w-[300px] px-3 py-2.5">
                      <Link to={requestPath(request.key)} className="font-medium text-[#464EB8] hover:underline">
                        {request.key}
                      </Link>
                      <p className="truncate text-gray-900" title={request.title}>
                        {request.title}
                      </p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(request.createdAt)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <CategoryChip category={request.category} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-800">
                      {getUserById(request.requesterId)?.name ?? 'Unknown'}
                      {request.onBehalfOfId && <p className="text-xs text-gray-500">for {getUserById(request.onBehalfOfId)?.name}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      {isDone(request) ? (
                        <span className="text-gray-700">{getUserById(request.assigneeId)?.name ?? '—'}</span>
                      ) : (
                        <select
                          value={request.assigneeId ?? ''}
                          onChange={(event) => assign.mutate({ id: request.id, assigneeId: event.target.value || undefined })}
                          aria-label={`Assignee of ${request.key}`}
                          className={cn('h-8 w-36 rounded-md border bg-white px-2 text-xs', request.assigneeId ? 'border-gray-200 text-gray-800' : 'border-amber-300 text-amber-900')}
                        >
                          <option value="">Unassigned</option>
                          {team.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.id === userId ? `${member.name} (me)` : member.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <PriorityIndicator priority={request.priority} />
                    </td>
                    <td className="px-3 py-2.5">
                      <RequestStatusBadge request={request} />
                    </td>
                    <td className="px-3 py-2.5">
                      <SlaChip clock={clock} label={request.firstResponseAt || isDone(request) ? 'Resolution' : 'Response'} compact />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
