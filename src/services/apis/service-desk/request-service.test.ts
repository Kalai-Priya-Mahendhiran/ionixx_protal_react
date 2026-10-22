import { notificationService } from '../notifications/notification-service';
import { resetDeskSettings } from './desk-settings-service';
import { requestService, resetRequests, runDeskChecks } from './request-service';

const employee = { id: 'EMP001', role: 'employee' as const };
const colleague = { id: 'EMP002', role: 'employee' as const };
const desk = { id: 'ADM001', role: 'admin' as const };
const deskMate = { id: 'ADM002', role: 'admin' as const };

const raise = (actor = employee) =>
  requestService.create(actor, { category: 'facility', title: 'Chair is broken', description: 'The seat keeps sinking', priority: 'medium' });

describe('requestService', () => {
  beforeEach(() => {
    resetRequests([], []);
    resetDeskSettings();
  });

  it('raises a request with the next key and tells the Admin team', async () => {
    const request = await raise();
    expect(request).toMatchObject({ key: 'ADM-101', status: 'open', requesterId: 'EMP001', source: 'manual' });
    const [latest] = await notificationService.list(deskMate);
    expect(latest.title).toBe('New facility request ADM-101');
  });

  it('shows requesters only their own requests', async () => {
    await raise();
    await raise(colleague);
    expect((await requestService.list(employee)).map((request) => request.requesterId)).toEqual(['EMP001']);
    expect(await requestService.list(desk)).toHaveLength(2);
  });

  it('assigns only within the Admin team, and only by the Admin team', async () => {
    const request = await raise();
    await expect(requestService.assign(employee, request.id, 'ADM002')).rejects.toThrow("can't assign");
    await expect(requestService.assign(desk, request.id, 'EMP002')).rejects.toThrow('within the Admin team');
    expect((await requestService.assign(desk, request.id, 'ADM002')).assigneeId).toBe('ADM002');
  });

  it('sends system requests to the System Admin team, not the Admin team', async () => {
    const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
    const request = await requestService.create(employee, { category: 'account', title: "Can't log in", description: 'Locked out after the password change', priority: 'high' });
    expect(request.key).toBe('SYS-101');
    expect((await notificationService.list(sysAdmin))[0].title).toBe('New login & password request SYS-101');
    expect((await requestService.list(sysAdmin)).map((entry) => entry.key)).toEqual(['SYS-101']);
    expect(await requestService.list(desk)).toHaveLength(0);
    await expect(requestService.assign(desk, request.id, 'ADM002')).rejects.toThrow("can't assign");
    await expect(requestService.assign(sysAdmin, request.id, 'ADM002')).rejects.toThrow('within the System Admin team');
    expect((await requestService.assign(sysAdmin, request.id, 'SYS001')).assigneeId).toBe('SYS001');
  });

  it('passes a request raised with the wrong team on to the right one', async () => {
    const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };
    const request = await raise();
    await requestService.assign(desk, request.id, 'ADM002');
    const moved = await requestService.update(desk, request.id, { category: 'software' });
    // Unassigned, out of the Admin queue and into the System Admin queue
    expect(moved.assigneeId).toBeUndefined();
    expect(await requestService.list(desk)).toHaveLength(0);
    expect((await requestService.list(sysAdmin)).map((entry) => entry.id)).toEqual([request.id]);
    expect((await notificationService.list(sysAdmin))[0].title).toContain('passed to the System Admin team');
  });

  it('hides internal notes from the requester', async () => {
    const request = await raise();
    await requestService.addComment(desk, request.id, 'Vendor quote is ₹4,000', true);
    await requestService.addComment(desk, request.id, 'A technician is coming at 3 PM');
    await expect(requestService.addComment(employee, request.id, 'Sneaky', true)).rejects.toThrow('Only the Admin team');

    expect((await requestService.listComments(employee, request.id)).map((comment) => comment.body)).toEqual(['A technician is coming at 3 PM']);
    expect(await requestService.listComments(desk, request.id)).toHaveLength(2);
    await expect(requestService.listComments(colleague, request.id)).rejects.toThrow("can't see");
  });

  it('records the first response and pauses the clock while waiting', async () => {
    const request = await raise();
    await requestService.addComment(desk, request.id, 'Internal first', true);
    expect((await requestService.list(desk))[0].firstResponseAt).toBeUndefined();

    const started = await requestService.changeStatus(desk, request.id, { to: 'in-progress' });
    expect(started.firstResponseAt).toBeDefined();
    await expect(requestService.changeStatus(desk, request.id, { to: 'waiting' })).rejects.toThrow('waiting for');
    const waiting = await requestService.changeStatus(desk, request.id, { to: 'waiting', waitingReason: 'vendor' });
    expect(waiting.waitingSince).toBeDefined();
    const resumed = await requestService.changeStatus(desk, request.id, { to: 'in-progress' });
    expect(resumed.waitingSince).toBeUndefined();
    expect(resumed.pausedMs).toBeGreaterThanOrEqual(0);
  });

  it('lets the requester reopen a resolved request and notifies them on resolution', async () => {
    const request = await raise();
    await requestService.changeStatus(desk, request.id, { to: 'resolved' });
    const [latest] = await notificationService.list(employee);
    expect(latest.title).toBe(`${request.key} is now resolved`);
    await expect(requestService.changeStatus(employee, request.id, { to: 'closed' })).rejects.toThrow("can't move");
    expect((await requestService.changeStatus(employee, request.id, { to: 'in-progress' })).resolvedAt).toBeUndefined();
  });

  it('alerts the team once when an SLA is breached, and auto-closes old resolved requests', async () => {
    const request = await raise();
    const later = new Date(Date.now() + 3 * 3600000); // facility response target is 2h
    runDeskChecks(later);
    runDeskChecks(later);
    const alerts = (await notificationService.list(deskMate)).filter((notification) => notification.title === `${request.key} breached its response SLA`);
    expect(alerts).toHaveLength(1);

    await requestService.changeStatus(desk, request.id, { to: 'resolved' });
    runDeskChecks(new Date(Date.now() + 8 * 24 * 3600000));
    expect((await requestService.list(desk))[0].status).toBe('closed');
  });
});
