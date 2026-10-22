import type { TaskAttachment, TaskPriority } from './task'

/* ---------- Requests ---------- */

// Office requests go to the Admin team; logins, access and software go to the System Admin team (see DESKS)
export type AdminRequestCategory = 'asset' | 'facility' | 'supplies' | 'transport' | 'travel' | 'visitor' | 'other'
export type SystemRequestCategory = 'account' | 'access' | 'software' | 'system-other'
export type RequestCategory = AdminRequestCategory | SystemRequestCategory

// The teams that work requests
export type DeskId = 'admin' | 'system'

// Open -> In Progress -> Waiting (vendor/approval) -> Resolved -> Closed
export type RequestStatus = 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed'

export type WaitingReason = 'vendor' | 'approval'

// Where a request came from: raised by someone, or created by an HR onboarding/offboarding checklist
export type RequestSource = 'manual' | 'onboarding' | 'offboarding' | 'checklist'

export interface AdminRequest {
  id: string
  key: string // e.g. ADM-12 (Admin) or SYS-12 (System Admin)
  category: RequestCategory
  title: string
  description: string
  priority: TaskPriority
  status: RequestStatus
  waitingReason?: WaitingReason
  requesterId: string
  // The person the request is for when someone else raised it (e.g. HR for a new joiner)
  onBehalfOfId?: string
  assigneeId?: string
  attachments: TaskAttachment[]
  source: RequestSource
  // HR checklist item this request fulfils; it is ticked off when the request is resolved
  linkedTaskId?: string
  createdAt: string
  updatedAt: string
  // SLA clock: first agent response, resolution, and time spent Waiting (the clock pauses then)
  firstResponseAt?: string
  resolvedAt?: string
  closedAt?: string
  waitingSince?: string
  pausedMs: number
  // Breach notifications already sent, so each is sent once
  breachNotified?: { response?: boolean; resolution?: boolean }
}

export interface RequestComment {
  id: string
  requestId: string
  authorId: string
  body: string
  // Internal notes are only visible to the Admin team, never to the requester
  internal: boolean
  createdAt: string
}

export interface RequestActivity {
  id: string
  requestId: string
  actorId: string // 'system' for automatic changes
  summary: string
  createdAt: string
}

/* ---------- SLA and budgets (desk settings) ---------- */

export interface SlaTarget {
  responseHours: number
  resolutionHours: number
}

export type SlaTargets = Record<RequestCategory, SlaTarget>

export type ExpenseCategory = AdminRequestCategory | 'maintenance' | 'utilities' | 'events'

// Monthly budget per expense category, in rupees
export type ExpenseBudgets = Record<ExpenseCategory, number>

export interface DeskSettings {
  sla: SlaTargets
  budgets: ExpenseBudgets
}

/* ---------- Assets ---------- */

export type AssetType = 'laptop' | 'monitor' | 'headset' | 'phone' | 'id-card' | 'access-card' | 'other'

export type AssetStatus = 'in-stock' | 'issued' | 'in-repair' | 'retired'

export interface AssetHistoryEntry {
  id: string
  action: 'added' | 'issued' | 'returned' | 'repair' | 'retired' | 'updated'
  userId?: string // who it was issued to or returned by
  actorId: string
  requestKey?: string
  note?: string
  at: string
}

export interface Asset {
  id: string
  tag: string // e.g. LAP-0012
  type: AssetType
  model: string
  serialNumber?: string
  status: AssetStatus
  assignedToId?: string
  issuedAt?: string
  history: AssetHistoryEntry[]
}

/* ---------- Office expenses ---------- */

export interface Expense {
  id: string
  date: string // YYYY-MM-DD
  category: ExpenseCategory
  vendor: string
  amount: number // rupees
  description?: string
  receipt?: TaskAttachment
  requestKey?: string
  recordedById: string
  createdAt: string
}
