import type { Location } from 'react-router-dom';

// ProtectedRoute sends people to /login with the page they asked for (e.g. a shared task link);
// after signing in they land back on it instead of the dashboard. Only same-app paths are followed.
export function getRedirectAfterLogin(state: unknown): string {
  const from = (state as { from?: Partial<Location> } | null)?.from;
  const path = from?.pathname;
  if (!path || !path.startsWith('/') || path.startsWith('//') || path === '/login') return '/dashboard';
  return `${path}${from.search ?? ''}${from.hash ?? ''}`;
}
