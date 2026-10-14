import type { Event, Notification } from '@/types';

export const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly team standup meeting',
    date: '2024-01-22',
    time: '14:00',
    type: 'meeting',
    attendees: ['1', '2', '3'],
    location: 'Conference Room A',
  },
  {
    id: '2',
    title: 'John Doe Birthday',
    description: 'Birthday celebration',
    date: '2024-01-25',
    time: '12:00',
    type: 'birthday',
    attendees: ['1', '2', '3'],
  },
  {
    id: '3',
    title: 'Project Deadline',
    description: 'Employee Portal Phase 1 completion',
    date: '2024-01-30',
    time: '17:00',
    type: 'deadline',
    attendees: ['1', '2', '3'],
  },
];

export const sampleNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'New Task Assigned',
    message: 'You have been assigned a new task: "Bug Fix"',
    type: 'info',
    isRead: false,
    createdAt: '2024-01-20T10:30:00Z',
    actionUrl: '/tasks/3',
  },
  {
    id: '2',
    userId: '1',
    title: 'Leave Request Approved',
    message: 'Your leave request for Jan 20-22 has been approved',
    type: 'success',
    isRead: false,
    createdAt: '2024-01-12T15:45:00Z',
    actionUrl: '/leave',
  },
  {
    id: '3',
    userId: '1',
    title: 'Team Meeting Reminder',
    message: 'Team meeting scheduled for tomorrow at 2:00 PM',
    type: 'warning',
    isRead: true,
    createdAt: '2024-01-21T09:00:00Z',
    actionUrl: '/calendar',
  },
];

export const quickStats = [
  { label: 'Attendance Rate', value: '95%', change: '+2%', icon: 'CheckCircle', color: 'text-green-600', bgColor: 'bg-green-100' },
  { label: 'Tasks Completed', value: '15/20', change: '+3', icon: 'Target', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { label: 'Hours This Week', value: '42h', change: '+5h', icon: 'Clock', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { label: 'Performance Score', value: '4.8', change: '+0.2', icon: 'Star', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
];

export const recentActivities = [
  { type: 'checkin', message: 'Checked in at 9:00 AM', time: 'Today', icon: 'CheckCircle', color: 'text-green-500' },
  { type: 'task', message: 'Completed "Update Documentation" task', time: 'Yesterday', icon: 'Target', color: 'text-blue-500' },
  { type: 'leave', message: 'Leave request approved', time: '2 days ago', icon: 'Calendar', color: 'text-yellow-500' },
  { type: 'meeting', message: 'Attended team standup', time: '3 days ago', icon: 'Users', color: 'text-purple-500' },
];

export const celebrationCards = [
  {
    title: 'Birthday',
    description: 'Team member birthdays this week',
    icon: 'Cake',
    color: 'text-pink-600',
    items: [
      { name: 'Sarah Johnson', date: 'Jan 25', status: 'Today', years: '25 years' },
      { name: 'Mike Chen', date: 'Jan 28', status: 'upcoming', years: '27 years' },
      { name: 'Lisa Wang', date: 'Jan 30', status: 'upcoming', years: '29 years' }
    ]
  },
  {
    title: 'Work Anniversary',
    description: 'Celebrating work milestones',
    icon: 'HeartHandshake',
    color: 'text-red-600',
    items: [
      { name: 'John Smith', date: 'Jan 20', status: 'completed', years: '2 years' },
      { name: 'Emma Davis', date: 'Jan 22', status: 'completed', years: '1 year' }
    ]
  },
  {
    title: 'Wedding Anniversary',
    description: 'Celebrating love and commitment',
    icon: 'Gift',
    color: 'text-purple-600',
    items: [
      { name: 'David & Maria', date: 'Jan 26', status: 'upcoming', years: '5 years' }
    ]
  }
];

export const quickActions = [
  { label: 'Add Task', icon: 'Plus', color: 'text-blue-600', hoverClass: 'hover:bg-blue-50 hover:border-blue-300' },
  { label: 'Apply Leave', icon: 'Calendar', color: 'text-green-600', hoverClass: 'hover:bg-green-50 hover:border-green-300' },
  { label: 'Upload File', icon: 'FileText', color: 'text-purple-600', hoverClass: 'hover:bg-purple-50 hover:border-purple-300' },
  { label: 'View Team', icon: 'Users', color: 'text-orange-600', hoverClass: 'hover:bg-orange-50 hover:border-orange-300' },
  { label: 'Reports', icon: 'TrendingUp', color: 'text-red-600', hoverClass: 'hover:bg-red-50 hover:border-red-300' },
  { label: 'Achievements', icon: 'Award', color: 'text-indigo-600', hoverClass: 'hover:bg-indigo-50 hover:border-indigo-300' },
];
