import { USER_DIRECTORY } from '@/lib/user-directory';
import type { AdminRequest, RequestStatus, TaskUser } from '@/types';
import { can, getScope, type PermissionUser, type TaskScopeTarget } from './task-permissions';

/*
 * Service desk rules, applied through the same permission matrix and `can()` as Tasks.
 * A request maps onto the task ownership rules: the person handling it is the assignee,
 * the requester is the reporter, and the person it was raised for follows it like a watcher.
 * The backend must enforce the same rules (and never return internal notes to requesters).
 */

export function requestScopeTarget(request: Pick<AdminRequest, 'requesterId' | 'assigneeId' | 'onBehalfOfId'>): TaskScopeTarget {
  return {
    assigneeId: request.assigneeId ?? '',
    reporterId: request.requesterId,
    type: 'task',
    watcherIds: request.onBehalfOfId ? [request.onBehalfOfId] : [],
  };
}

export function canViewRequest(user: PermissionUser | null | undefined, request: AdminRequest): boolean {
  return can(user, 'request.view', requestScopeTarget(request));
}

// Raising for yourself needs "own"; raising on someone else's behalf (e.g. HR for a new joiner) needs "all"
export function canRaiseRequest(user: PermissionUser | null | undefined, forUserId?: string): boolean {
  if (!user) return false;
  const target: TaskScopeTarget = { assigneeId: forUserId ?? user.id, reporterId: user.id, type: 'task' };
  return can(user, 'request.create', forUserId ? target : undefined);
}

export function canCommentOnRequest(user: PermissionUser | null | undefined, request: AdminRequest): boolean {
  return request.status !== 'closed' && can(user, 'request.comment', requestScopeTarget(request));
}

// Assigning, changing status and internal notes belong to the Admin team
export function canManageRequests(user: PermissionUser | null | undefined): boolean {
  return can(user, 'request.manage');
}

// Internal notes are shown only to people who work the queue
export const canSeeInternalNotes = canManageRequests;

// Resolved requests can be reopened by the requester for this long; after that they close automatically
export const REOPEN_WINDOW_DAYS = 7;

// Allowed status moves; Waiting needs a reason, and Closed is final
export const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  open: ['in-progress', 'waiting', 'resolved'],
  'in-progress': ['waiting', 'resolved'],
  waiting: ['in-progress', 'resolved'],
  resolved: ['in-progress', 'closed'],
  closed: [],
};

export function canChangeRequestStatus(user: PermissionUser | null | undefined, request: AdminRequest, to: RequestStatus, now: Date = new Date()): boolean {
  if (!REQUEST_TRANSITIONS[request.status].includes(to)) return false;
  if (canManageRequests(user)) return true;
  // The requester (or the person it's for) may reopen their own resolved request within the window
  const isRequester = !!user && (user.id === request.requesterId || user.id === request.onBehalfOfId);
  const withinWindow = !!request.resolvedAt && now.getTime() - new Date(request.resolvedAt).getTime() <= REOPEN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return isRequester && request.status === 'resolved' && to === 'in-progress' && withinWindow;
}

// The Admin team: everyone whose role works the queue
export function getDeskTeam(): TaskUser[] {
  return USER_DIRECTORY.filter((member) => getScope({ id: member.id, role: member.role }, 'request.manage') !== 'none');
}

export const canManageAssets = (user: PermissionUser | null | undefined) => can(user, 'asset.manage');
export const canManageExpenses = (user: PermissionUser | null | undefined) => can(user, 'expense.manage');
export const canConfigureDesk = (user: PermissionUser | null | undefined) => can(user, 'desk.configure');
export const canViewDeskReports = (user: PermissionUser | null | undefined) => can(user, 'desk.reports');
