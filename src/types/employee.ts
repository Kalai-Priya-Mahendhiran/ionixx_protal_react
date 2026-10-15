import type { LEAVE_TYPE_IDS } from '@/lib/schemas'
export interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  department: string
  designation: string
  employeeId: string
  joiningDate: string
  reportingManager: string
  role: 'employee' | 'manager' | 'admin'
  bankName?: string
  ifscCode?: string
  accountType?: string
  avatar?: string
}

export interface Attendance {
  id: string
  userId: string
  date: string
  checkIn: string
  checkOut: string
  status: 'present' | 'late' | 'absent'
  hoursWorked: number
}

export type LeaveDayPart = 'full-day' | 'first-half' | 'second-half'

export interface LeaveRequest {
  id: string
  userId: string
  leaveType: (typeof LEAVE_TYPE_IDS)[number]
  startDate: string
  startDayPart?: LeaveDayPart
  endDate: string
  endDayPart?: LeaveDayPart
  days?: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedDate: string
  approvedBy?: string
  approvedDate?: string
}

export type LeaveCountry = 'india' | 'canada' | 'united-states'

export interface Holiday {
  date: string
  name: string
  type: 'public' | 'restricted'
}

export interface TimeEntry {
  id: string
  userId: string
  project: string
  module?: string
  task: string
  date: string
  startTime: string
  endTime: string
  description: string
  totalHours: number
  status: 'submitted' | 'approved' | 'rejected'
  // Set when the entry came from "Log Work" on a task
  taskId?: string
}

export interface File {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: string
  uploadedDate: string
  category: string
  accessLevel: 'public' | 'private'
  url: string
  uploadedById?: string
  // Set for files attached to a task
  taskId?: string
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  type: 'meeting' | 'birthday' | 'deadline' | 'holiday' | 'other'
  attendees: string[]
  location?: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export interface Department {
  id: string
  name: string
  count: number
}
