import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LifeBuoy, Plus, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass, headerSecondaryButtonClass } from '@/components/ui/page-header';
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
import { PageTabs } from '@/components/ui/page-tabs';

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
        <PageHeader
          icon={LifeBuoy}
          title={isDesk ? 'Service Desk' : 'My Requests'}
          description={isDesk ? 'Office operations requests: assets, facilities, supplies, transport, travel and visitors' : 'Ask the Admin team for anything office-related and follow it here'}
          actions={
            <>
              {canConfigureDesk(user) && (
                <Button variant="outline" onClick={() => setSlaOpen(true)} className={cn('gap-2', headerSecondaryButtonClass)}>
                  <Timer className="h-4 w-4" />
                  SLA targets
                </Button>
              )}
              <Button onClick={() => setRaiseOpen(true)} className={cn('gap-2', headerPrimaryButtonClass)}>
                <Plus className="h-4 w-4" />
                Raise Admin Request
              </Button>
            </>
          }
        />

        {isDesk && (
          <PageTabs
            label="Service desk"
            tabs={[
              { id: 'queue', label: 'Request queue' },
              { id: 'mine', label: 'My requests' },
            ]}
            value={tab}
            onChange={(value) => setParams(value === 'mine' ? { tab: 'mine' } : {})}
          />
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
