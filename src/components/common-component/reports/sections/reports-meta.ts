import { BarChart3, Calendar, Clock, FileText, Users, type LucideIcon } from 'lucide-react';

export interface ReportType {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const REPORT_TYPES: ReportType[] = [
  { id: 'attendance', label: 'Attendance Report', icon: Clock, description: 'Daily attendance and working hours' },
  { id: 'leave', label: 'Leave Report', icon: Calendar, description: 'Leave requests and approvals' },
  { id: 'time-tracker', label: 'Time Tracker Report', icon: BarChart3, description: 'Project-wise time tracking' },
  { id: 'task', label: 'Task Report', icon: FileText, description: 'Task completion and productivity' },
  { id: 'employee', label: 'Employee Report', icon: Users, description: 'Employee performance and details' },
];
