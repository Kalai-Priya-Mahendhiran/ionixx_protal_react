import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { sampleNotifications } from '@/lib/sample-data/dashboard-sample-data';
import { DASHBOARD_NOTIFICATION_LIMIT } from '@/lib/constants';

const unreadCount = sampleNotifications.filter((notification) => !notification.isRead).length;

export function NotificationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Notifications</span>
          </div>
          <Badge className="bg-red-100 text-red-800">{unreadCount} new</Badge>
        </CardTitle>
        <CardDescription>Important updates and alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sampleNotifications.slice(0, DASHBOARD_NOTIFICATION_LIMIT).map((notification, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.isRead ? 'bg-gray-300' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
