import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { hasModuleAccess } from '@/lib/modules';
import { isUserActive } from '@/lib/user-access-store';

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
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user && !isUserActive(user.id)) return <SignOutDeactivated />;

  if (module && user && !hasModuleAccess(user, module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
