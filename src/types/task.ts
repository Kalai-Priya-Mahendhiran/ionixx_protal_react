import type { TASK_ISSUE_TYPES, TASK_PRIORITIES, TASK_WORKFLOW_STATUSES } from '@/lib/schemas'
import type { UserRole } from '@/lib/mock-users'

export type TaskStatus = (typeof TASK_WORKFLOW_STATUSES)[number]
export type TaskType = (typeof TASK_ISSUE_TYPES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export interface TaskAttachment {
  id: string
  name: string
  // Linked file in the Files module, when the attachment lives there
  fileId?: string
  url?: string
  sizeBytes?: number
}

export interface Task {
  id: string
  key: string // e.g. IXP-101, derived from the project key
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
  isBlocked: boolean
  blockedReason?: string
  attachments: TaskAttachment[]
  createdAt: string // ISO timestamp
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
  avatar?: string
}

export interface TaskComment {
  id: string
  taskId: string
  authorId: string
  body: string
  mentionIds: string[]
  createdAt: string
}

export type TaskActivityType = 'created' | 'updated' | 'status-changed' | 'assigned' | 'duplicated' | 'deleted' | 'commented'

export interface TaskActivity {
  id: string
  taskId: string
  actorId: string
  type: TaskActivityType
  field?: string
  from?: string
  to?: string
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
