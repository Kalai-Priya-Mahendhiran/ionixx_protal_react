import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { notificationService } from './notification-service';

export const NOTIFICATIONS_KEY = ['notifications'] as const;

// Polls so notifications raised by other users' actions show up without a reload
const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, user?.id],
    queryFn: () => notificationService.list(user!),
    enabled: !!user,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMarkNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    // No id marks everything as read
    mutationFn: (id?: string) => (id ? notificationService.markRead(user!, id) : notificationService.markAllRead(user!)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useUnreadNotificationCount(): number {
  const { data = [] } = useNotifications();
  return data.filter((notification) => !notification.isRead).length;
}
