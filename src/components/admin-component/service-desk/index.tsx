import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LifeBuoy, Plus, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass, headerSecondaryButtonClass } from '@/components/ui/page-header';
import MainLayout from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useCreateFromLink } from '@/hooks/use-create-from-link';
import { DEFAULT_DESK_SETTINGS, DESKS } from '@/lib/desk-config';
import { canConfigureDesk, canManageRequests, desksHandledBy } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';
import { useDeskSettings, useRequests } from '@/services/apis/service-desk/use-service-desk';
import { requestPath } from './sections/desk-links';
import { MyRequestsSection, QueueSection, RaiseRequestDialog, SlaSettingsDialog } from './sections';
import { PageTabs } from '@/components/common-component/tabs';

/*
 * Service desk. Everyone raises requests with any team (Admin, System Admin…) and follows them in My Requests;
 * each team also works its own queue.
 */
function ServiceDeskPage({ user }: { user: PermissionUser }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesk = canManageRequests(user);
  const myDesks = desksHandledBy(user);
  const tab = isDesk && params.get('tab') === 'mine' ? 'mine' : isDesk ? 'queue' : 'mine';
  const { data: requests = [], isLoading, isError, refetch } = useRequests();
  const { data: settings = DEFAULT_DESK_SETTINGS } = useDeskSettings();
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);

  // Quick Add → Raise a Request
  useCreateFromLink(() => setRaiseOpen(true));

  const mine = requests.filter((request) => request.requesterId === user.id || request.onBehalfOfId === user.id);
  // The queue holds only requests for the desks this person works
  const queue = requests.filter((request) => canManageRequests(user, request));

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={LifeBuoy}
          title={isDesk ? 'Service Desk' : 'My Requests'}
          description={
            isDesk
              ? `${myDesks.map((desk) => desk.team).join(' and ')} queue · ${myDesks.map((desk) => desk.summary.toLowerCase()).join('; ')}`
              : `Ask the ${DESKS.map((desk) => desk.team).join(' or ')} and follow your requests here`
          }
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
                Raise a Request
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
            <QueueSection requests={queue} desks={myDesks} settings={settings} userId={user.id} isLoading={isLoading} />
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
