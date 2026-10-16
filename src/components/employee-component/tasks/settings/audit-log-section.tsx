import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toCsvField } from '@/lib/task-export';
import { USER_DIRECTORY, getUserById } from '@/lib/user-directory';
import { cn, formatDateTime, getInitials, todayAsDateInput } from '@/lib/utils';
import type { AuditFilters } from '@/services/apis/audit/audit-service';
import { useAuditLog } from '@/services/apis/settings/use-task-settings';
import type { AuditEntity, AuditEntry } from '@/types';
import { taskPath } from '../sections/task-link';

const PAGE_SIZE = 50;

const ENTITY_LABELS: Record<AuditEntity, string> = {
  task: 'Task',
  project: 'Project',
  template: 'Template',
  settings: 'Settings',
  automation: 'Automation',
};

const ENTITY_STYLE: Record<AuditEntity, string> = {
  task: 'bg-indigo-100 text-indigo-700',
  project: 'bg-sky-100 text-sky-700',
  template: 'bg-pink-100 text-pink-700',
  settings: 'bg-gray-100 text-gray-700',
  automation: 'bg-amber-100 text-amber-800',
};

const actorName = (actorId: string) => (actorId === 'system' ? 'Automation' : (getUserById(actorId)?.name ?? actorId));

function downloadAuditCsv(entries: AuditEntry[]) {
  const header = ['When', 'Who', 'Area', 'Item', 'Action', 'Details'];
  const rows = entries.map((entry) => [formatDateTime(entry.at), actorName(entry.actorId), ENTITY_LABELS[entry.entity], entry.entityKey, entry.action, entry.summary]);
  const csv = String.fromCharCode(0xfeff) + [header, ...rows].map((row) => row.map(toCsvField).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `ionixx-audit-${todayAsDateInput()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AuditLogSection() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(0);
  const { data: entries = [], isLoading, isError, refetch } = useAuditLog(filters);

  const update = (changes: Partial<AuditFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(0);
  };
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const shown = entries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Audit log</h2>
            <p className="mt-1 text-sm text-gray-600">Who changed what and when: tasks, projects, templates, settings and automation.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadAuditCsv(entries)} disabled={entries.length === 0} className="gap-1.5">
            <Download className="h-4 w-4" />
            Export CSV ({entries.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={filters.search ?? ''}
              onChange={(event) => update({ search: event.target.value || undefined })}
              placeholder="Task key or text, e.g. IXP-102"
              aria-label="Search the audit log"
              className="pl-9"
            />
          </div>
          <select
            value={filters.actorId ?? ''}
            onChange={(event) => update({ actorId: event.target.value || undefined })}
            aria-label="User"
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">Everyone</option>
            <option value="system">Automation</option>
            {[...USER_DIRECTORY]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
          </select>
          <select
            value={filters.entity ?? ''}
            onChange={(event) => update({ entity: (event.target.value || undefined) as AuditEntity | undefined })}
            aria-label="Area"
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="">All areas</option>
            {(Object.keys(ENTITY_LABELS) as AuditEntity[]).map((entity) => (
              <option key={entity} value={entity}>
                {ENTITY_LABELS[entity]}
              </option>
            ))}
          </select>
          <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
            <Input type="date" value={filters.from ?? ''} max={filters.to} onChange={(event) => update({ from: event.target.value || undefined })} aria-label="From date" />
            <span className="text-gray-400">–</span>
            <Input type="date" value={filters.to ?? ''} min={filters.from} onChange={(event) => update({ to: event.target.value || undefined })} aria-label="To date" />
          </div>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setFilters({});
              setPage(0);
            }}
            className="text-sm font-medium text-[#464EB8] hover:underline"
          >
            Clear filters
          </button>
        )}

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-gray-100" />
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load the audit log.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            <History className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            {hasFilters ? 'No changes match these filters.' : 'Nothing has been recorded yet.'}
          </div>
        ) : (
          <>
            <div className="ionixx-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Who</th>
                    <th className="px-3 py-2">Area</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">What changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {shown.map((entry) => (
                    <tr key={entry.id} className="hover:bg-indigo-50/40">
                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">{formatDateTime(entry.at)}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                            {entry.actorId === 'system' ? '⚙' : getInitials(actorName(entry.actorId))}
                          </span>
                          {actorName(entry.actorId)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', ENTITY_STYLE[entry.entity])}>{ENTITY_LABELS[entry.entity]}</span>
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {entry.entity === 'task' ? (
                          <Link to={taskPath(entry.entityKey)} className="text-[#464EB8] hover:underline">
                            {entry.entityKey}
                          </Link>
                        ) : (
                          <span className="text-gray-900">{entry.entityKey}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{entry.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {page * PAGE_SIZE + 1}–{Math.min(entries.length, (page + 1) * PAGE_SIZE)} of {entries.length}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  Newer
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= pageCount - 1}>
                  Older
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
