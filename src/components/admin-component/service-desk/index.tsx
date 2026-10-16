import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { DEFAULT_DESK_SETTINGS } from '@/lib/desk-config';
import { canConfigureDesk, canManageRequests } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';
import { useDeskSettings, useRequests } from '@/services/apis/service-desk/use-service-desk';
import { requestPath } from './desk-links';
import { MyRequestsSection } from './my-requests-section';
import { QueueSection } from './queue-section';
import { RaiseRequestDialog } from './raise-request-dialog';
import { SlaSettingsDialog } from './sla-settings-dialog';

/*
 * Admin service desk. Everyone raises requests and follows them in My Requests;
 * the Admin team (request.manage) also works the queue.
 */
function ServiceDeskPage({ user }: { user: PermissionUser }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesk = canManageRequests(user);
  const tab = isDesk && params.get('tab') === 'mine' ? 'mine' : isDesk ? 'queue' : 'mine';
  const { data: requests = [], isLoading, isError, refetch } = useRequests();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);

  // Quick Add → "Raise Admin Request" lands here with ?raise=1
  useEffect(() => {
    if (params.get('raise') !== '1') return;
    setRaiseOpen(true);
    setParams(
      (current) => {
        current.delete('raise');
        return current;
      },
      { replace: true },
    );
  }, [params, setParams]);

  const mine = requests.filter((request) => request.requesterId === user.id || request.onBehalfOfId === user.id);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isDesk ? 'Service Desk' : 'My Requests'}</h1>
            <p className="mt-2 text-gray-600">
              {isDesk ? 'Office operations requests: assets, facilities, supplies, transport, travel and visitors' : 'Ask the Admin team for anything office-related and follow it here'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canConfigureDesk(user) && (
              <Button variant="outline" onClick={() => setSlaOpen(true)} className="gap-2">
                <Timer className="h-4 w-4" />
                SLA targets
              </Button>
            )}
            <Button onClick={() => setRaiseOpen(true)} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <Plus className="h-4 w-4" />
              Raise Admin Request
            </Button>
          </div>
        </div>

        {isDesk && (
          <div role="tablist" aria-label="Service desk" className="flex gap-1 border-b border-gray-200">
            {(
              [
                ['queue', 'Request queue'],
                ['mine', 'My requests'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setParams(value === 'mine' ? { tab: 'mine' } : {})}
                className={cn('-mb-px border-b-2 px-4 py-2 text-sm font-medium', tab === value ? 'border-[#464EB8] text-[#464EB8]' : 'border-transparent text-gray-600 hover:text-gray-900')}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === 'queue' ? (
          isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
              Couldn't load the queue.{' '}
              <button type="button" onClick={() => refetch()} className="font-medium underline">
                Try again
              </button>
            </div>
          ) : (
            <QueueSection requests={requests} settings={settings} userId={user.id} isLoading={isLoading} />
          )
        ) : (
          <MyRequestsSection
            requests={mine}
            settings={settings}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            onRaise={() => setRaiseOpen(true)}
          />
        )}
      </div>

      <RaiseRequestDialog open={raiseOpen} onOpenChange={setRaiseOpen} onRaised={(request) => navigate(requestPath(request.key))} />
      <SlaSettingsDialog open={slaOpen} onOpenChange={setSlaOpen} sla={settings.sla} />
    </MainLayout>
  );
}

export default function ServiceDesk() {
  const { user } = useAuth();
  // ProtectedRoute guarantees a signed-in user; this guard just narrows the type
  if (!user) return null;
  return <ServiceDeskPage user={user} />;
}
