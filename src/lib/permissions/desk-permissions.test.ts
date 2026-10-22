import {
  canChangeRequestStatus,
  canCommentOnRequest,
  canManageAssets,
  canManageRequests,
  canRaiseRequest,
  canViewRequest,
  getDeskTeam,
} from '@/lib/permissions/desk-permissions';
import type { AdminRequest } from '@/types';

const employee = { id: 'EMP001', role: 'employee' as const };
const colleague = { id: 'EMP002', role: 'employee' as const };
const hr = { id: 'HR001', role: 'hr' as const };
const desk = { id: 'ADM002', role: 'admin' as const };
const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };

const request = (overrides: Partial<AdminRequest> = {}): AdminRequest => ({
  id: 'R1',
  key: 'ADM-1',
  category: 'asset',
  title: 'Laptop',
  description: '',
  priority: 'medium',
  status: 'open',
  requesterId: 'EMP001',
  attachments: [],
  source: 'manual',
  createdAt: '2026-10-16T08:00:00.000Z',
  updatedAt: '2026-10-16T08:00:00.000Z',
  pausedMs: 0,
  ...overrides,
});

describe('desk permissions', () => {
  it('lets requesters see only their own requests, and the Admin team see all', () => {
    expect(canViewRequest(employee, request())).toBe(true);
    expect(canViewRequest(colleague, request())).toBe(false);
    expect(canViewRequest(desk, request())).toBe(true);
    expect(canViewRequest(sysAdmin, request())).toBe(false);
  });

  it('lets the person a request was raised for follow it', () => {
    const forJoiner = request({ requesterId: 'HR001', onBehalfOfId: 'EMP007' });
    expect(canViewRequest({ id: 'EMP007', role: 'employee' }, forJoiner)).toBe(true);
    expect(canCommentOnRequest({ id: 'EMP007', role: 'employee' }, forJoiner)).toBe(true);
  });

  it('lets anyone raise requests for themselves, but only HR and Admin for others', () => {
    expect(canRaiseRequest(employee)).toBe(true);
    expect(canRaiseRequest(employee, 'EMP002')).toBe(false);
    expect(canRaiseRequest(hr, 'EMP007')).toBe(true);
    expect(canRaiseRequest(desk, 'EMP007')).toBe(true);
  });

  it('keeps office queue work, assets and expenses with the Admin team', () => {
    expect(canManageRequests(desk, request())).toBe(true);
    expect(canManageAssets(desk)).toBe(true);
    for (const user of [employee, hr]) {
      expect(canManageRequests(user)).toBe(false);
      expect(canManageAssets(user)).toBe(false);
    }
    expect(canManageRequests(sysAdmin, request())).toBe(false);
    expect(canManageAssets(sysAdmin)).toBe(false);
    expect(getDeskTeam('admin').map((member) => member.id).sort()).toEqual(['ADM001', 'ADM002', 'ADM003']);
  });

  it('sends login, access and software requests to the System Admin team only', () => {
    const access = request({ key: 'SYS-1', category: 'access' });
    expect(canManageRequests(sysAdmin, access)).toBe(true);
    expect(canViewRequest(sysAdmin, access)).toBe(true);
    // Each team sees only its own queue (plus what they raised themselves)
    expect(canManageRequests(desk, access)).toBe(false);
    expect(canViewRequest(desk, access)).toBe(false);
    expect(canViewRequest(desk, request({ category: 'access', requesterId: 'ADM002' }))).toBe(true);
    expect(getDeskTeam('system').every((member) => member.role === 'system_admin')).toBe(true);
    expect(getDeskTeam('system').length).toBeGreaterThan(0);
  });

  it('follows the workflow, and lets requesters reopen within 7 days only', () => {
    const now = new Date('2026-10-16T12:00:00.000Z');
    expect(canChangeRequestStatus(desk, request(), 'in-progress', now)).toBe(true);
    expect(canChangeRequestStatus(desk, request({ status: 'closed' }), 'in-progress', now)).toBe(false);
    expect(canChangeRequestStatus(employee, request(), 'resolved', now)).toBe(false);

    const resolved = request({ status: 'resolved', resolvedAt: '2026-10-14T12:00:00.000Z' });
    expect(canChangeRequestStatus(employee, resolved, 'in-progress', now)).toBe(true);
    expect(canChangeRequestStatus(colleague, resolved, 'in-progress', now)).toBe(false);
    expect(canChangeRequestStatus(employee, { ...resolved, resolvedAt: '2026-10-01T12:00:00.000Z' }, 'in-progress', now)).toBe(false);
  });

  it('stops comments once a request is closed', () => {
    expect(canCommentOnRequest(employee, request({ status: 'closed' }))).toBe(false);
  });
});
