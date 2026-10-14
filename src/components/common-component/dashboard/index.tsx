import MainLayout from '@/components/layout/main-layout';
import {
  WelcomeHeaderSection,
  QuickStatsSection,
  TimeTrackingSection,
  UpcomingEventsSection,
  CelebrationCardsSection,
  RecentActivitiesSection,
  NotificationsSection,
  QuickActionsSection,
} from './sections';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <WelcomeHeaderSection />

        {/* Quick Stats */}
        <QuickStatsSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Time Tracking Card */}
          <TimeTrackingSection />

          {/* Upcoming Events */}
          <UpcomingEventsSection />
        </div>

        {/* Celebration Cards */}
        <CelebrationCardsSection />

        {/* Recent Activities & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentActivitiesSection />
          <NotificationsSection />
        </div>

        {/* Quick Actions */}
        <QuickActionsSection />
      </div>
    </MainLayout>
  );
}
