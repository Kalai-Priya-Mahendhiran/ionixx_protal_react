import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { generateId } from '@/lib/utils';
import type { Notification } from '@/types';

/*
 * In-app notifications behind the header bell. In-memory mock (lasts until refresh).
 * Other services call `notify`; with the backend that happens server-side and the
 * client only lists and marks notifications as read.
 */

export type NotificationInput = Pick<Notification, 'userId' | 'title' | 'message' | 'type' | 'actionUrl'>;

const MOCK_LATENCY_MS = 100;
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

let notifications: Notification[] = [
  {
    id: 'NTF-1', userId: 'EMP001', type: 'info', isRead: false, createdAt: hoursAgo(2),
    title: 'IXP-103 assigned to you', message: 'Priya Kumar assigned you "Login fails on mobile Safari"', actionUrl: '/tasks/IXP-103',
  },
  {
    id: 'NTF-2', userId: 'EMP001', type: 'info', isRead: false, createdAt: hoursAgo(72),
    title: 'Priya Kumar mentioned you on IXP-102', message: 'please focus on the refresh-token edge cases first.', actionUrl: '/tasks/IXP-102',
  },
  {
    id: 'NTF-3', userId: 'PM001', type: 'warning', isRead: false, createdAt: hoursAgo(48),
    title: 'IXP-106 is blocked', message: 'Divya Menon: Waiting for AWS access to the build bucket', actionUrl: '/tasks/IXP-106',
  },
  {
    id: 'NTF-4', userId: 'PM001', type: 'info', isRead: false, createdAt: hoursAgo(20),
    title: 'Kalai Priya mentioned you on IXP-104', message: 'ready for review, the restricted holidays now show a tooltip.', actionUrl: '/tasks/IXP-104',
  },
];

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

export const notificationService = {
  // GET /api/notifications — newest first
  async list(actor: PermissionUser): Promise<Notification[]> {
    await delay();
    return notifications
      .filter((notification) => notification.userId === actor.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // POST /api/notifications/:id/read
  async markRead(actor: PermissionUser, id: string): Promise<void> {
    notifications = notifications.map((item) => (item.id === id && item.userId === actor.id ? { ...item, isRead: true } : item));
  },

  // POST /api/notifications/read-all
  async markAllRead(actor: PermissionUser): Promise<void> {
    notifications = notifications.map((item) => (item.userId === actor.id ? { ...item, isRead: true } : item));
  },

  // Server-side in the real system: one notification per recipient, never to the person who acted
  notify(recipientIds: string[], actorId: string, input: Omit<NotificationInput, 'userId'>): void {
    const recipients = [...new Set(recipientIds)].filter((id) => id && id !== actorId);
    const createdAt = new Date().toISOString();
    notifications = [
      ...recipients.map((userId) => ({ ...input, userId, id: generateId(), isRead: false, createdAt })),
      ...notifications,
    ];
  },
};
