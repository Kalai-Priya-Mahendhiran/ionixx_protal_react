import type { RequestCategory } from './service-desk'
import type { TASK_ISSUE_TYPES, TASK_PRIORITIES, TASK_WORKFLOW_STATUSES } from '@/lib/schemas'
import type { UserRole } from '@/lib/mock-users'

// Built-in statuses whose meaning the code relies on (done = finished, in-review = approval step).
// Workflows can add custom statuses, so any string is a valid status.
export type SystemStatus = (typeof TASK_WORKFLOW_STATUSES)[number]
export type TaskStatus = SystemStatus | (string & {})
export type TaskType = (typeof TASK_ISSUE_TYPES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface TaskAttachment {
  id: string
  name: string
  // Linked file in the Files module, when the attachment lives there
  fileId?: string
  url?: string
  sizeBytes?: number
  uploadedById?: string
  uploadedAt?: string
}

export interface Task {
  id: string
  key: string // e.g. IXP-101, derived from the project key
  // Keys from projects the task was moved out of, so old links still work
  previousKeys?: string[]
  projectId: string
  type: TaskType
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  reporterId: string
  watcherIds: string[]
  labels: string[]
  startDate?: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD
  estimateHours?: number
  loggedHours: number
  parentId?: string // set for sub-tasks
  epicId?: string // the epic this task belongs to
  sprintId?: string // unset = in the backlog
  // Set on checklists created from a template (e.g. onboarding): the template and the employee it is for
  templateId?: string
  subjectId?: string
  isBlocked: boolean
  blockedReason?: string
  attachments: TaskAttachment[]
  createdAt: string // ISO timestamp
  // When the task last reached Done (cleared if it moves back); drives velocity and burndown
  completedAt?: string
  updatedAt: string
}

// Fields a user fills in when creating or editing a task
export type TaskInput = Pick<
  Task,
  | 'projectId'
  | 'type'
  | 'title'
  | 'description'
  | 'priority'
  | 'assigneeId'
  | 'startDate'
  | 'dueDate'
  | 'labels'
  | 'epicId'
  | 'sprintId'
  | 'estimateHours'
  | 'attachments'
>

export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  status: SprintStatus
}

// Lightweight epic reference for pickers and chips
export type EpicSummary = Pick<Task, 'id' | 'key' | 'title' | 'projectId'>

export interface Project {
  id: string
  key: string // drives task keys, e.g. IXP -> IXP-101
  name: string
  description?: string
  leadId: string
  memberIds: string[]
  defaultIssueType: TaskType
}

// Directory entry used to show names and avatars instead of IDs
export interface TaskUser {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  designation: string
  managerId?: string
  joiningDate?: string // YYYY-MM-DD
  birthDate?: string // YYYY-MM-DD, for birthday wishes on the dashboard
  // Set from the person's own Profile; win over roster/sample contact details
  phone?: string
  location?: string
  avatar?: string
}

/* ---------- HR templates ---------- */

export type TemplateKind = 'onboarding' | 'offboarding' | 'custom'

// Who gets an item when the template is applied
// 'admin' items become Admin service desk requests, tracked on the checklist by HR
export type TemplateOwner = 'hr' | 'it' | 'admin' | 'manager' | 'employee' | 'specific'

export interface TaskTemplateItem {
  id: string
  title: string
  description?: string
  owner: TemplateOwner
  ownerId?: string // only for 'specific'
  requestCategory?: RequestCategory // only for 'admin'
  // Days from the anchor date (joining day for onboarding, last working day for offboarding); negative = before
  offsetDays: number
  priority: TaskPriority
  estimateHours?: number
}

export interface TaskTemplate {
  id: string
  name: string
  kind: TemplateKind
  description?: string
  items: TaskTemplateItem[]
  updatedById: string
  updatedAt: string
}

/* ---------- Leave (as seen from Tasks) ---------- */

// An approved absence. Only dates are shared outside Leave Tracker, never the type or reason.
export interface LeaveAbsence {
  userId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  body: string
  mentionIds: string[]
  createdAt: string
}

export type TaskActivityType =
  | 'created'
  | 'updated'
  | 'status-changed'
  | 'assigned'
  | 'duplicated'
  | 'deleted'
  | 'commented'
  | 'subtask-added'
  | 'attachment-added'
  | 'attachment-removed'
  | 'work-logged'
  | 'blocked'
  | 'unblocked'
  | 'watched'
  | 'unwatched'

export interface TaskActivity {
  id: string
  taskId: string
  actorId: string
  type: TaskActivityType
  field?: string
  from?: string
  to?: string
  note?: string
  createdAt: string
}

export interface WorkLog {
  id: string
  taskId: string
  userId: string
  hours: number
  note: string
  date: string // YYYY-MM-DD
  createdAt: string
}

// A named set of task filters a person saved for themselves
export interface SavedFilter {
  id: string
  ownerId: string
  name: string
  query: string // Filter URL parameters, e.g. "due=overdue&priority=high,urgent"
  search?: string
  createdAt: string
}
