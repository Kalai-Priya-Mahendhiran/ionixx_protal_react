import type { TaskRecord } from '@/components/employee-component/time-tracker/sections/task-form';
import { taskLogService } from '@/services/apis/time-tracker/task-log-service';
import type { TimeEntry } from '@/types';
import { productivity, weekStartOf, weeklyDistribution } from './time-tracker-stats';

const entry = (date: string, project: string, totalHours: number): TimeEntry => ({ id: `${date}-${project}`, userId: 'EMP001', project, task: 'Coding', date, startTime: '09:00', endTime: '10:00', description: '', totalHours, status: 'approved' });

describe('time tracker stats', () => {
  it('splits only this week by project, biggest first', () => {
    // Wednesday 2026-10-21; the week starts Monday 2026-10-19
    expect(weekStartOf(new Date('2026-10-21T10:00:00'))).toBe('2026-10-19');
    const split = weeklyDistribution([entry('2026-10-19', 'Employee Portal', 6), entry('2026-10-20', 'People Operations', 2), entry('2026-10-16', 'Employee Portal', 8)], '2026-10-21');
    expect(split.map((row) => [row.project, row.hours, row.percentage])).toEqual([
      ['Employee Portal', 6, 75],
      ['People Operations', 2, 25],
    ]);
  });

  it('counts finished tasks, ignoring those on hold', () => {
    const task = (status: TaskRecord['status']) => ({ status }) as TaskRecord;
    expect(productivity([task('completed'), task('started'), task('hold')])).toBe(50);
    expect(productivity([])).toBe(0);
  });
});

describe('task log', () => {
  it("keeps each person's log separately and survives re-reading", async () => {
    const employee = { id: 'EMP001', role: 'employee' as const };
    const before = (await taskLogService.list(employee)).length;
    const [created] = await taskLogService.create(employee, [{ date: '2026-10-22', status: 'started', project: 'Employee Portal', module: 'Dashboard', task: 'Coding', description: 'Live stats', estimateHours: 2, actualHours: undefined, completedDate: '' }]);
    expect(await taskLogService.list(employee)).toHaveLength(before + 1);
    expect(await taskLogService.list({ id: 'EMP002', role: 'employee' })).toHaveLength(0);
    await taskLogService.remove(employee, created.id);
    expect(await taskLogService.list(employee)).toHaveLength(before);
  });
});
