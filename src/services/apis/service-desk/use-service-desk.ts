import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { canManageAssets, canManageExpenses } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import type { AssetStatus, ExpenseBudgets, SlaTargets } from '@/types';
import { NOTIFICATIONS_KEY } from '../notifications/use-notifications';
import { assetService, type AssetInput } from './asset-service';
import { deskSettingsService } from './desk-settings-service';
import { expenseService, type ExpenseInput } from './expense-service';
import { requestService, type RequestInput, type StatusChange } from './request-service';

export const REQUESTS_KEY = ['service-desk', 'requests'] as const;
export const ASSETS_KEY = ['service-desk', 'assets'] as const;
export const EXPENSES_KEY = ['service-desk', 'expenses'] as const;
export const DESK_SETTINGS_KEY = ['service-desk', 'settings'] as const;

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('The service desk requires a signed-in user');
  return user;
}

const errorToast = (error: unknown) => toast.error(error instanceof Error ? error.message : 'Something went wrong');

// Every desk change can notify someone, so the bell refreshes too
function useDeskMutation<TVariables, TResult>(
  mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<TResult>,
  keys: readonly (readonly string[])[],
  successMessage?: (result: TResult, variables: TVariables) => string,
) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (result, variables) => {
      [...keys, NOTIFICATIONS_KEY].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      if (successMessage) toast.success(successMessage(result, variables));
    },
    onError: errorToast,
  });
}

/* ---------- Requests ---------- */

export function useRequests() {
  const actor = useActor();
  return useQuery({ queryKey: [...REQUESTS_KEY, actor.id], queryFn: () => requestService.list(actor) });
}

export function useRequestComments(requestId: string | undefined) {
  const actor = useActor();
  return useQuery({ queryKey: [...REQUESTS_KEY, 'comments', requestId, actor.id], queryFn: () => requestService.listComments(actor, requestId!), enabled: !!requestId });
}

export function useRequestActivity(requestId: string | undefined) {
  const actor = useActor();
  return useQuery({ queryKey: [...REQUESTS_KEY, 'activity', requestId, actor.id], queryFn: () => requestService.listActivity(actor, requestId!), enabled: !!requestId });
}

export const useRaiseRequest = () =>
  useDeskMutation((actor, input: RequestInput) => requestService.create(actor, input), [REQUESTS_KEY], (request) => `${request.key} raised. The Admin team has been notified.`);

export const useUpdateRequest = () =>
  useDeskMutation(
    (actor, { id, changes }: { id: string; changes: Parameters<typeof requestService.update>[2] }) => requestService.update(actor, id, changes),
    [REQUESTS_KEY],
  );

export const useAssignRequest = () =>
  useDeskMutation((actor, { id, assigneeId }: { id: string; assigneeId?: string }) => requestService.assign(actor, id, assigneeId), [REQUESTS_KEY]);

export const useChangeRequestStatus = () =>
  useDeskMutation((actor, { id, change }: { id: string; change: StatusChange }) => requestService.changeStatus(actor, id, change), [REQUESTS_KEY, ['tasks']]);

export const useAddRequestComment = () =>
  useDeskMutation(
    (actor, { id, body, internal }: { id: string; body: string; internal?: boolean }) => requestService.addComment(actor, id, body, internal),
    [REQUESTS_KEY],
  );

/* ---------- Assets ---------- */

export function useAssets() {
  const actor = useActor();
  return useQuery({ queryKey: [...ASSETS_KEY, actor.id], queryFn: () => assetService.list(actor), enabled: canManageAssets(actor) });
}

export function useMyAssets() {
  const actor = useActor();
  return useQuery({ queryKey: [...ASSETS_KEY, 'mine', actor.id], queryFn: () => assetService.listMine(actor) });
}

export const useCreateAsset = () => useDeskMutation((actor, input: AssetInput) => assetService.create(actor, input), [ASSETS_KEY], (asset) => `${asset.tag} added to the asset log`);

export const useIssueAsset = () =>
  useDeskMutation(
    (actor, { id, userId, requestKey }: { id: string; userId: string; requestKey?: string }) => assetService.issue(actor, id, userId, requestKey),
    [ASSETS_KEY],
    (asset) => `${asset.tag} issued`,
  );

export const useReturnAsset = () =>
  useDeskMutation(
    (actor, { id, note, requestKey }: { id: string; note?: string; requestKey?: string }) => assetService.returnAsset(actor, id, note, requestKey),
    [ASSETS_KEY],
    (asset) => `${asset.tag} returned to stock`,
  );

export const useSetAssetStatus = () =>
  useDeskMutation(
    (actor, { id, status, note }: { id: string; status: Exclude<AssetStatus, 'issued'>; note?: string }) => assetService.setStatus(actor, id, status, note),
    [ASSETS_KEY],
  );

/* ---------- Expenses and settings ---------- */

export function useExpenses() {
  const actor = useActor();
  return useQuery({ queryKey: [...EXPENSES_KEY, actor.id], queryFn: () => expenseService.list(actor), enabled: canManageExpenses(actor) });
}

export const useCreateExpense = () => useDeskMutation((actor, input: ExpenseInput) => expenseService.create(actor, input), [EXPENSES_KEY], () => 'Expense recorded');

export const useUpdateExpense = () =>
  useDeskMutation((actor, { id, input }: { id: string; input: ExpenseInput }) => expenseService.update(actor, id, input), [EXPENSES_KEY], () => 'Expense updated');

export const useDeleteExpense = () => useDeskMutation((actor, id: string) => expenseService.remove(actor, id), [EXPENSES_KEY], () => 'Expense deleted');

export function useDeskSettings() {
  return useQuery({ queryKey: DESK_SETTINGS_KEY, queryFn: () => deskSettingsService.get() });
}

// SLA targets change every timer on screen, so refresh requests too
export const useSaveSla = () => useDeskMutation((actor, sla: SlaTargets) => deskSettingsService.saveSla(actor, sla), [DESK_SETTINGS_KEY, REQUESTS_KEY], () => 'SLA targets saved');

export const useSaveBudgets = () => useDeskMutation((actor, budgets: ExpenseBudgets) => deskSettingsService.saveBudgets(actor, budgets), [DESK_SETTINGS_KEY], () => 'Budgets saved');
