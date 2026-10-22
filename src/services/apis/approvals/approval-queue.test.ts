import { ROUTES } from '@/lib/constants';
import { getSidebarItems, hasModuleAccess } from '@/lib/modules';
import { resetAccessRecords } from '@/lib/user-access-store';
import { leaveService } from '../leave/leave-service';
import { notificationService } from '../notifications/notification-service';
import { userAccessService } from '../users/user-access-service';
import { approvalQueue } from './approval-queue';

const employee = { id: 'EMP001', role: 'employee' as const }; // reports to PM001
const manager = { id: 'PM001', role: 'project_manager' as const };
const hr = { id: 'HR001', role: 'hr' as const };
const executive = { id: 'EXE001', role: 'executive' as const };
const sysAdmin = { id: 'SYS001', role: 'system_admin' as const };

const leaveInput = { leaveType: 'casual' as const, startDate: '2026-12-01', startDayPart: 'full-day' as const, endDate: '2026-12-02', endDayPart: 'full-day' as const, days: 2, reason: 'Family visit' };

describe('approval queue', () => {
  afterEach(() => resetAccessRecords());

  it("puts an employee's leave in their manager's queue and notifies the manager", async () => {
    const request = await leaveService.apply(employee, leaveInput);
    const queue = await approvalQueue.list(manager);
    expect(queue.find((item) => item.id === request.id)).toMatchObject({ source: 'leave', requesterName: 'Kalai Priya', typeLabel: 'Casual Leave', status: 'pending' });
    expect((await notificationService.list(manager)).some((note) => note.title.includes('Kalai Priya applied'))).toBe(true);
  });

  it("sends the decision back to the employee's Leave Tracker and notifies them", async () => {
    const request = await leaveService.apply(employee, { ...leaveInput, reason: 'Exam' });
    await approvalQueue.decide(manager, { source: 'leave', id: request.id }, 'approved');
    const mine = await leaveService.list(employee);
    expect(mine.find((entry) => entry.id === request.id)).toMatchObject({ status: 'approved', approvedBy: 'Priya Kumar' });
    expect((await notificationService.list(employee)).some((note) => note.title.includes('was approved'))).toBe(true);
    // Approved leave now counts as an absence for task due-date warnings
    expect((await leaveService.listAbsences()).some((absence) => absence.userId === 'EMP001' && absence.startDate === '2026-12-01')).toBe(true);
  });

  it('routes leadership requests to the executive and lets HR act on anyone', async () => {
    expect((await approvalQueue.list(executive)).some((item) => item.requesterId === 'HR001' && item.status === 'pending')).toBe(true);
    expect((await approvalQueue.list(hr)).some((item) => item.requesterId === 'EMP003')).toBe(true);
    // HR never decides their own leave
    expect((await approvalQueue.list(hr)).some((item) => item.requesterId === 'HR001')).toBe(false);
  });

  it('keeps work-from-home requests in the same queue', async () => {
    expect((await approvalQueue.list(manager)).some((item) => item.kind === 'wfh' && item.requesterId === 'EMP002')).toBe(true);
  });

  it("refuses decisions from people who aren't the approver", async () => {
    const request = await leaveService.apply(employee, { ...leaveInput, reason: 'Trip' });
    await expect(approvalQueue.decide(employee, { source: 'leave', id: request.id }, 'approved')).rejects.toThrow();
    await expect(approvalQueue.decide({ id: 'ADM001', role: 'admin' }, { source: 'leave', id: request.id }, 'approved')).rejects.toThrow();
  });

  it('gives Approvals to a team lead as soon as someone reports to them', async () => {
    expect(hasModuleAccess(employee, ROUTES.Approvals)).toBe(false);
    const intern = await userAccessService.invite(sysAdmin, { name: 'Ravi Kiran', email: 'ravi.kiran@example.com', role: 'employee', department: 'Engineering', designation: 'Intern', managerId: 'EMP001' });
    expect(hasModuleAccess(employee, ROUTES.Approvals)).toBe(true);
    expect(getSidebarItems(employee).map((item) => item.path)).toContain(ROUTES.Approvals);
    // Their team's requests now reach them
    const request = await leaveService.apply({ id: intern.id, role: 'employee' }, { ...leaveInput, reason: 'Orientation travel' });
    expect((await approvalQueue.list(employee)).some((item) => item.id === request.id)).toBe(true);
  });
});
