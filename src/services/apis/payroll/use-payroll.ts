import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { payrollService, type ClaimInput, type DeclarationInput } from './payroll-service';

export const PAYROLL_KEY = ['payroll'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Pay & Tax requires a signed-in user');
  return user;
}

export function useMyClaims() {
  const actor = useActor();
  return useQuery({ queryKey: [...PAYROLL_KEY, 'claims', actor.id], queryFn: () => payrollService.listClaims(actor) });
}

export function useMyDeclarations() {
  const actor = useActor();
  return useQuery({ queryKey: [...PAYROLL_KEY, 'declarations', actor.id], queryFn: () => payrollService.listDeclarations(actor) });
}

// New submissions also land in the reviewers' Approvals queue
function usePayrollMutation<TVariables, TResult>(run: (actor: PermissionUser, variables: TVariables) => Promise<TResult>, success: (result: TResult, variables: TVariables) => string) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => run(actor, variables),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEY });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast.success(success(result, variables));
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Something went wrong'),
  });
}

export function useSubmitClaim() {
  return usePayrollMutation((actor, input: ClaimInput) => payrollService.submitClaim(actor, input), (claim) => `Claim ${claim.claimNo} submitted`);
}

export function useSubmitDeclaration() {
  return usePayrollMutation(
    (actor, { input, replacesId }: { input: DeclarationInput; replacesId?: string }) => payrollService.submitDeclaration(actor, input, replacesId),
    (declaration, { replacesId }) => (replacesId ? `${declaration.id} resubmitted for review` : 'Investment submitted for review'),
  );
}
