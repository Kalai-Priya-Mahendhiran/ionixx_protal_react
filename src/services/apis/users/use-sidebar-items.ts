import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@/lib/mock-users';
import { getSidebarItems } from '@/lib/modules';
import { USERS_KEY } from './use-user-access';

/*
 * The signed-in person's menu, recomputed whenever user data changes (User Management invalidates every query),
 * so granted/removed pages and data-driven pages like Approvals appear without a reload.
 */
export function useSidebarItems(user: { id: string; role: UserRole } | null | undefined) {
  const { data } = useQuery({
    queryKey: [...USERS_KEY, 'sidebar', user?.id, user?.role],
    queryFn: async () => getSidebarItems(user),
    initialData: () => getSidebarItems(user),
    enabled: !!user,
  });
  return user ? data : [];
}
