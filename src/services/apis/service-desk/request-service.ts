import { REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS, REQUEST_STATUS_LABELS, WAITING_REASON_LABELS } from '@/lib/desk-config';
import {
  REOPEN_WINDOW_DAYS,
  canChangeRequestStatus,
  canCommentOnRequest,
  canManageRequests,
  canRaiseRequest,
  canSeeInternalNotes,
  canViewRequest,
  getDeskTeam,
} from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleRequestActivity, sampleRequestComments, sampleRequests } from '@/lib/sample-data/service-desk-sample-data';
import { getSlaStatus } from '@/lib/sla';
import { getUserById } from '@/lib/user-directory';
import { generateId } from '@/lib/utils';
import type { AdminRequest, RequestActivity, RequestCategory, RequestComment, RequestSource, RequestStatus, TaskAttachment, TaskPriority, WaitingReason } from '@/types';
import { auditService } from '../audit/audit-service';
import { notificationService } from '../notifications/notification-service';
import { getSlaTarget } from './desk-settings-service';

/*
 * Admin service desk requests. In-memory mock (resets on refresh); each method notes its endpoint.
 * The backend must apply the same rules: requesters only see their own requests and never internal notes,
 * and only the Admin team assigns requests or moves them through the workflow.
 */

export interface RequestInput {
  category: RequestCategory;
  title: string;
  description: string;
  priority: TaskPriority;
  attachments?: TaskAttachment[];
  // Raise it for someone else (needs request.create for them)
  onBehalfOfId?: string;
}

export interface LinkedRequestInput extends RequestInput {
  source: Exclude<RequestSource, 'manual'>;
  linkedTaskId: string;
}

export interface StatusChange {
  to: RequestStatus;
  waitingReason?: WaitingReason;
}

export class RequestPermissionError extends Error {
  constructor(message = "You don't have permission to do that") {
    super(message);
    this.name = 'RequestPermissionError';
  }
}

const MOCK_LATENCY_MS = 200;
const MAX_TITLE = 120;
const MAX_COMMENT = 2000;
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
const DAY_MS = 24 * 60 * 60 * 1000;

let requests: AdminRequest[] = sampleRequests.map((request) => ({ ...request }));
let comments: RequestComment[] = sampleRequestComments.map((comment) => ({ ...comment }));
let activity: RequestActivity[] = sampleRequestActivity.map((entry) => ({ ...entry }));

// Other modules react to resolutions without importing this one (e.g. HR checklist items tick themselves off)
type ResolvedListener = (request: AdminRequest) => void;
const resolvedListeners: ResolvedListener[] = [];
export function onRequestResolved(listener: ResolvedListener): void {
  resolvedListeners.push(listener);
}

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const now = () => new Date().toISOString();
const nameOf = (id?: string) => (id ? (getUserById(id)?.name ?? 'Someone') : 'Nobody');
const requestPath = (key: string) => `/service-desk/${key}`;

function nextKey(): string {
  const highest = requests.reduce((max, request) => Math.max(max, Number(request.key.split('-')[1]) || 0), 100);
  return `ADM-${highest + 1}`;
}

function findRequest(id: string): AdminRequest {
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error('That request no longer exists');
  return request;
}

function save(updated: AdminRequest): AdminRequest {
  const saved = { ...updated, updatedAt: now() };
  requests = requests.map((request) => (request.id === saved.id ? saved : request));
  return saved;
}

function log(request: AdminRequest, actorId: string, summary: string, action = 'updated') {
  activity = [{ id: generateId(), requestId: request.id, actorId, summary, createdAt: now() }, ...activity];
  auditService.record({ actorId, entity: 'request', entityKey: request.key, action, summary: `${request.title}: ${summary}` });
}

// The requester and whoever it was raised for hear about progress
const followers = (request: AdminRequest) => [request.requesterId, request.onBehalfOfId ?? ''];
// New or unassigned work goes to the whole Admin team; assigned work to the assignee
const handlers = (request: AdminRequest) => (request.assigneeId ? [request.assigneeId] : getDeskTeam().map((member) => member.id));

function validate(input: RequestInput) {
  if (!REQUEST_CATEGORIES.includes(input.category)) throw new Error('Choose a category');
  const title = input.title.trim();
  if (!title) throw new Error('Add a short summary');
  if (title.length > MAX_TITLE) throw new Error(`Keep the summary under ${MAX_TITLE} characters`);
  if (!PRIORITIES.includes(input.priority)) throw new Error('Choose a priority');
  if (input.onBehalfOfId && !getUserById(input.onBehalfOfId)) throw new Error('Choose who the request is for');
}

// skipRaiseCheck: requests created by an HR checklist are authorised by template.manage instead
function create(actor: PermissionUser, input: RequestInput, extra: Partial<AdminRequest> = {}, skipRaiseCheck = false): AdminRequest {
  validate(input);
  const forUserId = input.onBehalfOfId && input.onBehalfOfId !== actor.id ? input.onBehalfOfId : undefined;
  if (!skipRaiseCheck && !canRaiseRequest(actor, forUserId)) throw new RequestPermissionError(forUserId ? `You can't raise requests for ${nameOf(forUserId)}` : "You can't raise Admin requests");
  const timestamp = now();
  const request: AdminRequest = {
    id: generateId(),
    key: nextKey(),
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    status: 'open',
    requesterId: actor.id,
    onBehalfOfId: forUserId,
    attachments: input.attachments ?? [],
    source: 'manual',
    createdAt: timestamp,
    updatedAt: timestamp,
    pausedMs: 0,
    ...extra,
  };
  requests = [request, ...requests];
  log(request, actor.id, forUserId ? `Raised the request for ${nameOf(forUserId)}` : 'Raised the request', 'created');
  notificationService.notify(handlers(request), actor.id, {
    type: request.priority === 'urgent' ? 'warning' : 'info',
    title: `New ${REQUEST_CATEGORY_LABELS[request.category].toLowerCase()} request ${request.key}`,
    message: `${nameOf(actor.id)}: ${request.title}`,
    actionUrl: requestPath(request.key),
  });
  return request;
}

// Status side effects: the SLA clock (first response, pause while Waiting) and timestamps
function applyStatus(request: AdminRequest, actor: PermissionUser, change: StatusChange): AdminRequest {
  const timestamp = now();
  const next: AdminRequest = { ...request, status: change.to };
  if (request.status === 'waiting' && request.waitingSince) {
    next.pausedMs = request.pausedMs + Math.max(0, Date.now() - new Date(request.waitingSince).getTime());
    next.waitingSince = undefined;
    next.waitingReason = undefined;
  }
  if (change.to === 'waiting') {
    next.waitingSince = timestamp;
    next.waitingReason = change.waitingReason;
  }
  // An Admin picking the request up (or resolving it) is its first response
  if (!request.firstResponseAt && canManageRequests(actor) && change.to !== 'open') next.firstResponseAt = timestamp;
  if (change.to === 'resolved') next.resolvedAt = timestamp;
  if (request.status === 'resolved' && change.to === 'in-progress') next.resolvedAt = undefined;
  if (change.to === 'closed') next.closedAt = timestamp;
  return next;
}

// Housekeeping the backend would run on a schedule: auto-close old resolved requests, send SLA breach alerts once
export function runDeskChecks(at: Date = new Date()): void {
  requests = requests.map((request) => {
    if (request.status === 'resolved' && request.resolvedAt && at.getTime() - new Date(request.resolvedAt).getTime() > REOPEN_WINDOW_DAYS * DAY_MS) {
      const closed = { ...request, status: 'closed' as const, closedAt: at.toISOString(), updatedAt: at.toISOString() };
      activity = [{ id: generateId(), requestId: request.id, actorId: 'system', summary: `Closed automatically after ${REOPEN_WINDOW_DAYS} days`, createdAt: at.toISOString() }, ...activity];
      return closed;
    }
    if (request.status === 'resolved' || request.status === 'closed') return request;

    const sla = getSlaStatus(request, getSlaTarget(request.category), at);
    const notified = { ...request.breachNotified };
    const alert = (kind: 'response' | 'resolution') => {
      notified[kind] = true;
      notificationService.notify(handlers(request), 'system', {
        type: 'error',
        title: `${request.key} breached its ${kind} SLA`,
        message: `${REQUEST_CATEGORY_LABELS[request.category]}: ${request.title}`,
        actionUrl: requestPath(request.key),
      });
    };
    if (sla.response.state === 'breached' && !notified.response) alert('response');
    if (sla.resolution.state === 'breached' && !notified.resolution) alert('resolution');
    return notified.response === request.breachNotified?.response && notified.resolution === request.breachNotified?.resolution
      ? request
      : { ...request, breachNotified: notified };
  });
}

export const requestService = {
  // GET /api/service-desk/requests — the queue for the Admin team, "My Requests" for everyone else
  async list(actor: PermissionUser): Promise<AdminRequest[]> {
    await delay();
    runDeskChecks();
    return requests.filter((request) => canViewRequest(actor, request)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // POST /api/service-desk/requests
  async create(actor: PermissionUser, input: RequestInput): Promise<AdminRequest> {
    await delay();
    return create(actor, input);
  },

  // Called by taskService.applyTemplate for Admin items of HR onboarding/offboarding checklists
  createLinked(actor: PermissionUser, input: LinkedRequestInput): AdminRequest {
    const { source, linkedTaskId, ...rest } = input;
    return create(actor, rest, { source, linkedTaskId }, true);
  },

  // PATCH /api/service-desk/requests/:key { category, priority }
  async update(actor: PermissionUser, id: string, changes: Partial<Pick<AdminRequest, 'category' | 'priority'>>): Promise<AdminRequest> {
    await delay();
    const request = findRequest(id);
    if (!canManageRequests(actor)) throw new RequestPermissionError("You can't change this request");
    if (changes.category && !REQUEST_CATEGORIES.includes(changes.category)) throw new Error('Choose a category');
    if (changes.priority && !PRIORITIES.includes(changes.priority)) throw new Error('Choose a priority');
    const updated = save({ ...request, ...changes });
    const summary = [
      changes.category && changes.category !== request.category && `Changed the category from ${REQUEST_CATEGORY_LABELS[request.category]} to ${REQUEST_CATEGORY_LABELS[changes.category]}`,
      changes.priority && changes.priority !== request.priority && `changed the priority from ${request.priority} to ${changes.priority}`,
    ].filter(Boolean);
    if (summary.length) log(updated, actor.id, summary.join(', '));
    return updated;
  },

  // PATCH /api/service-desk/requests/:key { assigneeId } — within the Admin team only
  async assign(actor: PermissionUser, id: string, assigneeId: string | undefined): Promise<AdminRequest> {
    await delay();
    const request = findRequest(id);
    if (!canManageRequests(actor)) throw new RequestPermissionError("You can't assign requests");
    if (request.status === 'closed') throw new Error('Closed requests can no longer be reassigned');
    if (assigneeId && !getDeskTeam().some((member) => member.id === assigneeId)) throw new Error('Requests can only be assigned within the Admin team');
    const updated = save({ ...request, assigneeId });
    log(updated, actor.id, assigneeId ? `Assigned to ${nameOf(assigneeId)}` : 'Unassigned');
    if (assigneeId) {
      notificationService.notify([assigneeId], actor.id, { type: 'info', title: `${request.key} assigned to you`, message: request.title, actionUrl: requestPath(request.key) });
      notificationService.notify(followers(request), actor.id, {
        type: 'info',
        title: `${request.key} is being handled by ${nameOf(assigneeId)}`,
        message: request.title,
        actionUrl: requestPath(request.key),
      });
    }
    return updated;
  },

  // PATCH /api/service-desk/requests/:key { status, waitingReason }
  async changeStatus(actor: PermissionUser, id: string, change: StatusChange): Promise<AdminRequest> {
    await delay();
    const request = findRequest(id);
    if (request.status === change.to) return request;
    if (!canChangeRequestStatus(actor, request, change.to)) throw new RequestPermissionError(`You can't move ${request.key} to ${REQUEST_STATUS_LABELS[change.to]}`);
    if (change.to === 'waiting' && !change.waitingReason) throw new Error('Say what the request is waiting for');

    const updated = save(applyStatus(request, actor, change));
    const reopened = request.status === 'resolved' && change.to === 'in-progress';
    const label = change.to === 'waiting' && change.waitingReason ? WAITING_REASON_LABELS[change.waitingReason] : REQUEST_STATUS_LABELS[change.to];
    log(updated, actor.id, reopened ? 'Reopened it' : `Moved it from ${REQUEST_STATUS_LABELS[request.status]} to ${label}`, 'status-changed');

    notificationService.notify(reopened ? handlers(updated) : followers(updated), actor.id, {
      type: change.to === 'resolved' ? 'success' : 'info',
      title: reopened ? `${request.key} was reopened` : `${request.key} is now ${label.toLowerCase()}`,
      message: request.title,
      actionUrl: requestPath(request.key),
    });
    if (change.to === 'resolved') resolvedListeners.forEach((listener) => listener(updated));
    return updated;
  },

  // GET /api/service-desk/requests/:key/comments — internal notes only for the Admin team
  async listComments(actor: PermissionUser, id: string): Promise<RequestComment[]> {
    await delay();
    const request = findRequest(id);
    if (!canViewRequest(actor, request)) throw new RequestPermissionError("You can't see this request");
    const showInternal = canSeeInternalNotes(actor);
    return comments.filter((comment) => comment.requestId === id && (showInternal || !comment.internal)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  // POST /api/service-desk/requests/:key/comments
  async addComment(actor: PermissionUser, id: string, body: string, internal = false): Promise<RequestComment> {
    await delay();
    const request = findRequest(id);
    if (!canCommentOnRequest(actor, request)) throw new RequestPermissionError(request.status === 'closed' ? 'This request is closed' : "You can't comment on this request");
    if (internal && !canSeeInternalNotes(actor)) throw new RequestPermissionError('Only the Admin team can add internal notes');
    const text = body.trim();
    if (!text) throw new Error('Write something first');
    if (text.length > MAX_COMMENT) throw new Error(`Keep comments under ${MAX_COMMENT} characters`);

    const comment: RequestComment = { id: generateId(), requestId: id, authorId: actor.id, body: text, internal, createdAt: now() };
    comments = [...comments, comment];
    // A public reply from the Admin team counts as the first response
    const fromDesk = canManageRequests(actor);
    if (fromDesk && !internal && !request.firstResponseAt) save({ ...request, firstResponseAt: comment.createdAt });
    else save(request);

    if (!internal) {
      const recipients = fromDesk ? followers(request) : handlers(request);
      notificationService.notify(recipients, actor.id, {
        type: 'info',
        title: `${nameOf(actor.id)} replied on ${request.key}`,
        message: text.length > 120 ? `${text.slice(0, 117)}…` : text,
        actionUrl: requestPath(request.key),
      });
    }
    return comment;
  },

  // GET /api/service-desk/requests/:key/activity
  async listActivity(actor: PermissionUser, id: string): Promise<RequestActivity[]> {
    await delay();
    const request = findRequest(id);
    if (!canViewRequest(actor, request)) throw new RequestPermissionError("You can't see this request");
    return activity.filter((entry) => entry.requestId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

// Test helpers
export function resetRequests(seed: AdminRequest[] = sampleRequests, seedComments: RequestComment[] = sampleRequestComments) {
  requests = seed.map((request) => ({ ...request }));
  comments = seedComments.map((comment) => ({ ...comment }));
  activity = [];
}
export const getAllRequestsForTests = () => requests;
