import { getOrgPeople, managerOf } from '@/lib/org-chart';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { performanceProfiles, type EmployeeGoal, type PerformanceProfile } from '@/lib/team-data';
import { todayAsDateInput } from '@/lib/utils';
import { notificationService } from '../notifications/notification-service';

/*
 * Performance reviews. Who you review comes from the live org chart (your direct reports;
 * HR sees everyone), so someone who joins your team appears here with an empty draft, and
 * someone who moves away drops off. Ratings and feedback are kept by the service.
 * In-memory mock that lasts until refresh.
 */

export interface ReviewFeedback {
  id: string;
  authorName: string;
  date: string;
  text: string;
}

export interface PerformanceReview extends PerformanceProfile {
  feedback: ReviewFeedback[];
}

interface ReviewRecord {
  reviewCycle: string;
  overallRating: number | null;
  selfRating: number | null;
  goals: EmployeeGoal[];
  lastReview?: string;
  feedback: ReviewFeedback[];
}

// Where a review stands follows from its data: rated by the manager, started (self rating or feedback), or not yet
export const reviewStatusOf = (record: Pick<ReviewRecord, 'overallRating' | 'selfRating' | 'feedback'>): PerformanceProfile['status'] =>
  record.overallRating !== null ? 'submitted' : record.selfRating !== null || record.feedback.length > 0 ? 'in-review' : 'draft';

const MOCK_LATENCY_MS = 150;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

// The half-year the review covers, e.g. "H2 2026"
export const reviewCycleOf = (date: string) => `H${Number(date.slice(5, 7)) <= 6 ? 1 : 2} ${date.slice(0, 4)}`;

let records = new Map<string, ReviewRecord>();
let sequence = 0;

export function resetPerformance() {
  records = new Map(
    performanceProfiles.map(({ employeeId, reviewCycle, overallRating, selfRating, goals, lastReview }) => [
      employeeId,
      { reviewCycle, overallRating, selfRating, goals: goals.map((goal) => ({ ...goal })), lastReview, feedback: [] },
    ]),
  );
  sequence = 0;
}
resetPerformance();

const recordFor = (employeeId: string): ReviewRecord =>
  records.get(employeeId) ?? { reviewCycle: reviewCycleOf(todayAsDateInput()), overallRating: null, selfRating: null, goals: [], feedback: [] };

// The reporting manager reviews; HR can review anyone. Nobody reviews themselves.
export const canReview = (actor: PermissionUser, employeeId: string) => employeeId !== actor.id && (managerOf(employeeId) === actor.id || actor.role === 'hr');

const toReview = (employeeId: string): PerformanceReview => {
  const person = getUserById(employeeId);
  const record = recordFor(employeeId);
  return { employeeId, employeeName: person?.name ?? 'Unknown', designation: person?.designation ?? '', ...record, lastReview: record.lastReview ?? '', status: reviewStatusOf(record) };
};

const save = (employeeId: string, changes: Partial<ReviewRecord>) => {
  records.set(employeeId, { ...recordFor(employeeId), ...changes });
};

export const performanceService = {
  // GET /api/performance/reviews — the people the caller reviews (people yet to join are left out)
  async listReviewees(actor: PermissionUser): Promise<PerformanceReview[]> {
    await delay();
    return getOrgPeople()
      .filter((person) => person.status !== 'invited' && canReview(actor, person.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((person) => toReview(person.id));
  },

  // POST /api/performance/reviews/:employeeId/rating — the employee is told
  async submitRating(actor: PermissionUser, employeeId: string, rating: number, feedback?: string): Promise<PerformanceReview> {
    await delay();
    if (!canReview(actor, employeeId)) throw new Error("You can't review this person");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Pick a rating from 1 to 5');
    const record = recordFor(employeeId);
    const today = todayAsDateInput();
    save(employeeId, { overallRating: rating, lastReview: today, feedback: feedback?.trim() ? [...record.feedback, note(actor, feedback)] : record.feedback });
    notificationService.notify([employeeId], actor.id, {
      title: `Your ${record.reviewCycle} review is in`,
      message: `${getUserById(actor.id)?.name ?? 'Your manager'} rated you ${rating}/5.`,
      type: 'success',
      actionUrl: '/dashboard',
    });
    return toReview(employeeId);
  },

  // POST /api/performance/reviews/:employeeId/feedback
  async shareFeedback(actor: PermissionUser, employeeId: string, text: string): Promise<PerformanceReview> {
    await delay();
    if (!canReview(actor, employeeId)) throw new Error("You can't review this person");
    if (!text.trim()) throw new Error('Write some feedback first');
    const record = recordFor(employeeId);
    save(employeeId, { feedback: [...record.feedback, note(actor, text)] });
    notificationService.notify([employeeId], actor.id, {
      title: 'New feedback on your review',
      message: text.trim(),
      type: 'info',
      actionUrl: '/dashboard',
    });
    return toReview(employeeId);
  },
};

function note(actor: PermissionUser, text: string): ReviewFeedback {
  return { id: `fb-${++sequence}`, authorName: getUserById(actor.id)?.name ?? 'Reviewer', date: todayAsDateInput(), text: text.trim() };
}
