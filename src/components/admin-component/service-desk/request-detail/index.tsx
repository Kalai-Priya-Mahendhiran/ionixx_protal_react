import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { ROUTES } from '@/lib/constants';
import { DEFAULT_DESK_SETTINGS } from '@/lib/desk-config';
import { canManageAssets, canManageRequests } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { getSlaStatus } from '@/lib/sla';
import { cn } from '@/lib/utils';
import { useDeskSettings, useRequestActivity, useRequests } from '@/services/apis/service-desk/use-service-desk';
import { RequestStatusBadge, SlaChip } from '../sections/desk-badges';
import { AssetsSection, ConversationSection, DetailsSection, HistorySection, RequestInfoSection, SlaSection, StatusActionsSection } from './sections';

function RequestDetailContent({ user }: { user: PermissionUser }) {
  const { requestKey = '' } = useParams();
  const { data: requests = [], isLoading, isError, refetch } = useRequests();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const request = requests.find((item) => item.key.toLowerCase() === requestKey.toLowerCase());
  const { data: activity = [] } = useRequestActivity(request?.id);
  const isDesk = request ? canManageRequests(user, request) : canManageRequests(user);
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
        <StatusActionsSection request={request} user={user} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <DetailsSection request={request} />
          <ConversationSection request={request} user={user} />
        </div>

        <aside className="space-y-6">
          <RequestInfoSection request={request} user={user} isDesk={isDesk} open={open} />
          <SlaSection sla={sla} />
          {canManageAssets(user) && request.category === 'asset' && <AssetsSection request={request} />}
          <HistorySection activity={activity} />
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
