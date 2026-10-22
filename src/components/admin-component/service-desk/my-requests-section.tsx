import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LifeBuoy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ASSET_TYPE_LABELS, deskOf } from '@/lib/desk-config';
import { getSlaStatus } from '@/lib/sla';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { useMyAssets } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, DeskSettings } from '@/types';
import { RequestStatusBadge, SlaChip } from './desk-badges';
import { CATEGORY_ICONS } from './desk-icons';
import { requestPath } from './desk-links';
import { PageTabs } from '@/components/ui/page-tabs';

const isDone = (request: AdminRequest) => request.status === 'resolved' || request.status === 'closed';

// What the person holds right now, from the asset log
function MyAssetsCard() {
  const { data: assets = [], isLoading } = useMyAssets();
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">Assets issued to you</h2>
        {isLoading ? (
          <div className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ) : assets.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing is recorded against you in the asset log.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {assets.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{asset.model}</span>
                  <span className="text-xs text-gray-500">
                    {ASSET_TYPE_LABELS[asset.type]} · {asset.tag}
                  </span>
                </span>
                {asset.issuedAt && <span className="shrink-0 text-xs text-gray-500">since {formatDate(asset.issuedAt)}</span>}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500">Something missing or wrong? Raise an Asset request.</p>
      </CardContent>
    </Card>
  );
}

export function MyRequestsSection({
  requests,
  settings,
  isLoading,
  isError,
  onRetry,
  onRaise,
  showAssets = true,
}: {
  requests: AdminRequest[];
  settings: DeskSettings;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onRaise: () => void;
  showAssets?: boolean;
}) {
  const [tab, setTab] = useState<'open' | 'done'>('open');
  const open = requests.filter((request) => !isDone(request));
  const done = requests.filter(isDone);
  const shown = tab === 'open' ? open : done;

  return (
    <div className={cn('grid gap-6', showAssets && 'lg:grid-cols-[minmax(0,1fr)_320px]')}>
      <div className="min-w-0 space-y-4">
        <PageTabs
          label="My requests"
          tabs={[
            { id: 'open', label: 'Open', count: open.length },
            { id: 'done', label: 'Resolved & closed', count: done.length },
          ]}
          value={tab}
          onChange={setTab}
        />

        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading requests">
            {[0, 1, 2].map((index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load your requests.{' '}
            <button type="button" onClick={onRetry} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <LifeBuoy className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
            <p className="font-medium text-gray-900">{tab === 'open' ? 'No open requests' : 'Nothing resolved yet'}</p>
            <p className="mt-1 text-sm text-gray-500">Need a laptop fixed, a cab or a visitor pass? Ask the Admin team. Can't log in or need access or software? Ask the System Admin team.</p>
            {tab === 'open' && (
              <Button onClick={onRaise} className="mt-4 gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                <Plus className="h-4 w-4" />
                Raise a Request
              </Button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((request) => {
              const Icon = CATEGORY_ICONS[request.category];
              const sla = getSlaStatus(request, settings.sla[request.category]);
              return (
                <li key={request.id}>
                  <Link
                    to={requestPath(request.key)}
                    className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-[#464EB8]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                      <Icon className="h-5 w-5 text-[#464EB8]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">{request.key}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{deskOf(request.category).team}</span>
                        <RequestStatusBadge request={request} />
                      </span>
                      <span className="block truncate font-medium text-gray-900 group-hover:text-[#464EB8]">{request.title}</span>
                      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span>Raised {formatRelativeTime(request.createdAt)}</span>
                        {request.onBehalfOfId && <span>for {getUserById(request.onBehalfOfId)?.name}</span>}
                        <span>{request.assigneeId ? `Handled by ${getUserById(request.assigneeId)?.name}` : 'Not picked up yet'}</span>
                        {!isDone(request) && <SlaChip clock={sla.resolution} label="Target" compact />}
                      </span>
                    </span>
                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-400 group-hover:text-[#464EB8]" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {showAssets && (
        <aside className="space-y-4">
          <MyAssetsCard />
        </aside>
      )}
    </div>
  );
}
