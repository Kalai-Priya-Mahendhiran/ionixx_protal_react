import type { UserRole } from '@/lib/mock-users'
import type { TaskPriority, TaskStatus, TaskType } from './task'

/* ---------- Permissions ---------- */

export type TaskAction =
  | 'task.view'
  | 'task.create'
  | 'task.assign'
  | 'task.edit'
  | 'task.changeStatus'
  | 'task.delete'
  | 'task.approve'
  | 'task.comment'
  | 'task.logWork'
  | 'task.watch'
  | 'sprint.manage'
  | 'template.manage'
  | 'project.manage'
  | 'workflow.configure'
  | 'reports.view'
  // Admin service desk (office operations)
  | 'request.create'
  | 'request.view'
  | 'request.comment'
  | 'request.manage'
  | 'asset.manage'
  | 'expense.manage'
  | 'desk.configure'
  | 'desk.reports'
  // User Management: accounts, roles, page and project access
  | 'user.manage'

// none: never · own: tasks assigned to (or reported by) the user · team: the user's direct reports
// hr: HR-type tasks only (not project work, even the user's own) · all: every task
// For service desk requests, own = requests they raised, are handling, or that were raised for them
export type PermissionScope = 'none' | 'own' | 'team' | 'hr' | 'all'

export type PermissionMatrix = Record<TaskAction, Record<UserRole, PermissionScope>>

/* ---------- Workflow ---------- */

// What a status means: where new work waits, work underway, the approval step, or finished
export type StatusCategory = 'todo' | 'active' | 'review' | 'done'

export type StatusColor = 'gray' | 'blue' | 'indigo' | 'purple' | 'teal' | 'green' | 'amber' | 'red'

export interface WorkflowStatus {
  id: TaskStatus
  label: string
  color: StatusColor
  category: StatusCategory
  enabled: boolean
  // Built-in statuses can be renamed and hidden but not deleted
  system: boolean
  // Show cards in another status's board column (e.g. Reopened inside To Do); unset = own column
  boardColumn?: TaskStatus
}

export interface WorkflowSettings {
  // Order here is the order on the board and in menus
  statuses: WorkflowStatus[]
  // Allowed moves: from status -> statuses it can move to
  transitions: Record<string, TaskStatus[]>
}

/* ---------- Fields ---------- */

export interface IssueTypeSetting {
  type: TaskType
  label: string
  enabled: boolean
}

export interface PrioritySetting {
  priority: TaskPriority
  label: string
}

export type LabelColor = 'sky' | 'pink' | 'emerald' | 'amber' | 'violet' | 'rose' | 'teal' | 'orange' | 'gray'

export interface LabelSetting {
  name: string
  color: LabelColor
}

export interface TaskSettings {
  workflow: WorkflowSettings
  issueTypes: IssueTypeSetting[]
  priorities: PrioritySetting[]
  labels: LabelSetting[]
  permissions: PermissionMatrix
  updatedAt: string
  updatedById: string
}

/* ---------- Automation ---------- */

export type AutomationTrigger = 'task-created' | 'status-changed' | 'assigned' | 'blocked' | 'due-date-passed'

export type ConditionField = 'status' | 'priority' | 'type' | 'project'

export interface AutomationCondition {
  field: ConditionField
  operator: 'is' | 'is-not'
  value: string
}

export type AutomationAction =
  | { kind: 'notify'; recipient: 'assignee' | 'reporter' | 'manager' | 'watchers' }
  | { kind: 'set-priority'; priority: TaskPriority }
  | { kind: 'add-label'; label: string }

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  trigger: AutomationTrigger
  // For 'status-changed': only when the task moves into this status (empty = any)
  triggerStatus?: TaskStatus
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  runCount: number
  lastRunAt?: string
  updatedById: string
  updatedAt: string
}

/* ---------- Audit ---------- */

export type AuditEntity = 'task' | 'project' | 'template' | 'settings' | 'automation' | 'request' | 'asset' | 'expense' | 'user'

export interface AuditEntry {
  id: string
  at: string // ISO timestamp
  actorId: string // 'system' for automation
  entity: AuditEntity
  entityKey: string // e.g. IXP-102, a project key, a template or rule name
  action: string // e.g. 'status-changed', 'created', 'updated'
  summary: string // human-readable, e.g. "Status: In Progress → In Review"
}
