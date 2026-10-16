import type { TaskUser } from './task'

// invited: account created, waiting for the person to sign in for the first time
export type AccountStatus = 'active' | 'invited' | 'deactivated'

// What System Admin controls per person, on top of their role
export interface AccessRecord {
  status: AccountStatus
  // Page (module) paths added or taken away compared with the role's defaults, e.g. '/reports'
  grantedModules: string[]
  revokedModules: string[]
  phone?: string
  invitedAt?: string
  deactivatedAt?: string
  lastSignInAt?: string
}

// A person in User Management: directory details plus access
export type UserAccount = TaskUser & AccessRecord & { hasLogin: boolean }
