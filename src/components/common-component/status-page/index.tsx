import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, Lock, type LucideIcon } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';
import { getModuleLabel } from '@/lib/modules';

/*
 * Shown instead of silently sending people to the Dashboard: a page they aren't allowed to open,
 * or an address that doesn't exist. Both keep the menu, so they can carry on from here.
 */

function StatusPage({ icon: Icon, code, title, message }: { icon: LucideIcon; code: string; title: string; message: string }) {
  const { pathname } = useLocation();
  return (
    <MainLayout>
      <div className="mx-auto max-w-xl py-10">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
              <Icon className="h-7 w-7 text-[#464EB8]" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-[#464EB8]">{code}</p>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-3 break-all font-mono text-xs text-gray-400">{pathname}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                Go back
              </Button>
              <Button asChild className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                <Link to={ROUTES.Dashboard}>
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

// A real page this person's role (or their access settings) doesn't include
export function NoAccessPage({ module }: { module: string }) {
  return (
    <StatusPage
      icon={Lock}
      code="No access"
      title={`You don't have access to ${getModuleLabel(module)}`}
      message="This page isn't part of your role. If you need it for your work, ask your System Administrator to grant access in User Management."
    />
  );
}

// An address that doesn't match any page
export function NotFoundPage() {
  return <StatusPage icon={Compass} code="404" title="Page not found" message="This address doesn't match any page. The link may be mistyped or out of date." />;
}
