import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DASHBOARD_NOTIFICATION_LIMIT } from '@/lib/constants';
import { timeAgo } from '@/lib/dashboard-feeds';
import { cn } from '@/lib/utils';
import { useMarkNotificationsRead, useNotifications } from '@/services/apis/notifications/use-notifications';
import { DASHBOARD_LIST_CLASS } from './dashboard-list';

// The same notifications as the header bell: leave decisions, approvals waiting, task updates…
export function NotificationsSection() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.filter((notification) => !notification.isRead).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-[#464EB8]" onClick={() => markRead.mutate(undefined)}>
                Mark all read
              </Button>
            )}
            <Badge className={unread ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}>{unread} new</Badge>
          </div>
        </CardTitle>
        <CardDescription>Important updates and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        {!isLoading && notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">You're all caught up.</p>
        ) : (
          <ul className={DASHBOARD_LIST_CLASS}>
            {notifications.slice(0, DASHBOARD_NOTIFICATION_LIMIT).map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (!notification.isRead) markRead.mutate(notification.id);
                    if (notification.actionUrl) navigate(notification.actionUrl);
                  }}
                  className="flex w-full items-start space-x-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', notification.isRead ? 'bg-gray-300' : 'bg-blue-500')} aria-label={notification.isRead ? undefined : 'Unread'} />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-gray-900">{notification.title}</span>
                    <span className="mt-1 block text-sm text-gray-600">{notification.message}</span>
                    <span className="mt-2 block text-xs text-gray-500">{timeAgo(notification.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
