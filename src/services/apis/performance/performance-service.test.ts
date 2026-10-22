import { ROUTES } from '@/lib/constants';
import { hasModuleAccess } from '@/lib/modules';
import { getOrgPeople } from '@/lib/org-chart';
import { notificationService } from '../notifications/notification-service';
import { performanceService, resetPerformance, reviewCycleOf } from './performance-service';

const manager = { id: 'PM001', role: 'project_manager' as const };
const employee = { id: 'EMP001', role: 'employee' as const };
const hr = { id: 'HR001', role: 'hr' as const };

describe('performance reviews', () => {
  beforeEach(() => resetPerformance());

  it("lists exactly the manager's direct reports from the org chart", async () => {
    const reports = getOrgPeople().filter((person) => person.managerId === 'PM001' && person.status !== 'invited').map((person) => person.id).sort();
    const reviewees = await performanceService.listReviewees(manager);
    expect(reviewees.map((review) => review.employeeId).sort()).toEqual(reports);
    expect(reviewees.find((review) => review.employeeId === 'EMP001')).toMatchObject({ employeeName: 'Kalai Priya', selfRating: 4 });
  });

  it('keeps a submitted rating and tells the employee', async () => {
    await performanceService.submitRating(manager, 'EMP001', 4, 'Great quarter');
    const review = (await performanceService.listReviewees(manager)).find((entry) => entry.employeeId === 'EMP001');
    expect(review).toMatchObject({ overallRating: 4, status: 'submitted' });
    expect(review?.feedback.map((entry) => entry.text)).toEqual(['Great quarter']);
    expect((await notificationService.list(employee)).some((note) => note.message.includes('4/5'))).toBe(true);
  });

  it('only lets the reporting manager or HR review, never yourself', async () => {
    await expect(performanceService.submitRating(employee, 'EMP002', 3)).rejects.toThrow("can't review");
    await expect(performanceService.shareFeedback(hr, 'HR001', 'Self note')).rejects.toThrow("can't review");
    await expect(performanceService.shareFeedback(hr, 'EMP001', 'Thanks for the onboarding help')).resolves.toMatchObject({ status: 'in-review' });
  });

  it('names the review cycle from the date and opens the page for team leads', () => {
    expect(reviewCycleOf('2026-10-22')).toBe('H2 2026');
    expect(reviewCycleOf('2026-03-01')).toBe('H1 2026');
    expect(hasModuleAccess(manager, ROUTES.PerformanceReview)).toBe(true);
    expect(hasModuleAccess({ id: 'EMP002', role: 'employee' }, ROUTES.PerformanceReview)).toBe(false);
  });
});
