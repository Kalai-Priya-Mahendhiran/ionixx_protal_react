import { useNavigate } from 'react-router-dom';
import { AlertTriangle, AtSign, BellOff, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useMarkNotificationsRead, useNotifications } from '@/services/apis/notifications/use-notifications';
import type { Notification } from '@/types';

const TYPE_ICON: Record<Notification['type'], { icon: LucideIcon; className: string }> = {
  info: { icon: Info, className: 'bg-indigo-100 text-indigo-600' },
  success: { icon: CheckCircle2, className: 'bg-green-100 text-green-600' },
  warning: { icon: AlertTriangle, className: 'bg-amber-100 text-amber-600' },
  error: { icon: XCircle, className: 'bg-red-100 text-red-600' },
};

const iconFor = (notification: Notification) =>
  notification.title.includes('mentioned you') ? { icon: AtSign, className: 'bg-purple-100 text-purple-600' } : TYPE_ICON[notification.type];

export function NotificationsPanel({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = notifications.filter((notification) => !notification.isRead).length;

  const open = (notification: Notification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (notification.actionUrl) navigate(notification.actionUrl);
    onNavigate();
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-md border border-gray-200 bg-white py-2 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h3 className="text-sm font-medium">Notifications</h3>
        {unread > 0 && (
          <button type="button" onClick={() => markRead.mutate(undefined)} className="text-xs font-medium text-[#464EB8] hover:underline">
            Mark all as read
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {isLoading && <p className="px-4 py-6 text-center text-sm text-gray-500">Loading…</p>}
        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            <BellOff className="mx-auto mb-2 h-6 w-6 text-gray-300" />
            You're all caught up
          </div>
        )}
        {notifications.map((notification) => {
          const { icon: Icon, className } = iconFor(notification);
          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => open(notification)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50',
                !notification.isRead && 'bg-indigo-50/50',
              )}
            >
              <span className={cn('mt-0.5 rounded-full p-1.5', className)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-gray-900">{notification.title}</span>
                <span className="block truncate text-xs text-gray-600">{notification.message}</span>
                <span className="mt-0.5 block text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
              </span>
              {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#464EB8]" aria-label="Unread" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
