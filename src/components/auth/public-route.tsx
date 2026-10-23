import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { getRedirectAfterLogin } from './redirect-after-login';

interface PublicRouteProps {
  children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getRedirectAfterLogin(location.state)} replace />;
  }

  return <>{children}</>;
}
