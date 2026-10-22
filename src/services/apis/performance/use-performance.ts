import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { NOTIFICATIONS_KEY } from '../notifications/use-notifications';
import { performanceService } from './performance-service';

export const PERFORMANCE_KEY = ['performance'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Performance reviews require a signed-in user');
  return user;
}

// Re-read whenever people change (people mutations refresh every query), so the list follows the org chart
export function useReviewees() {
  const actor = useActor();
  return useQuery({ queryKey: [...PERFORMANCE_KEY, 'reviewees', actor.id], queryFn: () => performanceService.listReviewees(actor) });
}

function usePerformanceMutation<TVariables>(run: (actor: PermissionUser, variables: TVariables) => Promise<{ employeeName: string }>, message: (name: string) => string) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => run(actor, variables),
    onSuccess: (review) => {
      queryClient.invalidateQueries({ queryKey: PERFORMANCE_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      toast.success(message(review.employeeName));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useSubmitRating() {
  return usePerformanceMutation(
    (actor, { employeeId, rating, feedback }: { employeeId: string; rating: number; feedback?: string }) => performanceService.submitRating(actor, employeeId, rating, feedback),
    (name) => `Rating submitted for ${name}`,
  );
}

export function useShareFeedback() {
  return usePerformanceMutation(
    (actor, { employeeId, text }: { employeeId: string; text: string }) => performanceService.shareFeedback(actor, employeeId, text),
    (name) => `Feedback shared with ${name}`,
  );
}
