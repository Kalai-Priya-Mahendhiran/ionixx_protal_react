import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { hasModuleAccess } from '@/lib/modules';
import { isUserActive } from '@/lib/user-access-store';
import { NoAccessPage } from '@/components/common-component/status-page';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // The page (module) path; access follows the role's defaults plus User Management overrides
  module?: string;
}

// Someone deactivated while signed in is signed out on their next page
function SignOutDeactivated() {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
    toast.error('Your account has been deactivated. Contact your System Administrator.');
  }, [logout]);
  return null;
}

export default function ProtectedRoute({ children, module }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user, signedOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember the page only for a link opened while signed out; after Sign out the next sign-in starts at the Dashboard
    return <Navigate to="/login" replace state={signedOut ? undefined : { from: location }} />;
  }

  if (user && !isUserActive(user.id)) return <SignOutDeactivated />;

  // Say so instead of quietly sending them to the Dashboard
  if (module && user && !hasModuleAccess(user, module)) {
    return <NoAccessPage module={module} />;
  }

  return <>{children}</>;
}
