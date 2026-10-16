import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import type { IssueTypeSetting, LabelSetting, PermissionMatrix, WorkflowSettings, PrioritySetting } from '@/types';
import { auditService, type AuditFilters } from '../audit/audit-service';
import { automationService, type AutomationRuleInput } from '../automation/automation-service';
import { taskService } from '../tasks/task-service';
import { taskSettingsService } from './task-settings-service';

export const TASK_SETTINGS_KEY = ['task-settings'] as const;
const AUTOMATION_KEY = ['automation-rules'] as const;
const AUDIT_KEY = ['audit'] as const;

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong');

function useActor(): PermissionUser {
  const { user } = useAuth();
  if (!user) throw new Error('Settings require a signed-in user');
  return user;
}

// Pages that render statuses, labels or permission-based controls subscribe to this, so they redraw after a save
export function useTaskSettings() {
  return useQuery({ queryKey: TASK_SETTINGS_KEY, queryFn: () => taskSettingsService.get() });
}

// Settings shape every screen (statuses, labels, who can do what), so a save refreshes everything
function useSettingsMutation<TVariables>(mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>, successMessage: string) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success(successMessage);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export const useSaveWorkflow = () =>
  useSettingsMutation((actor, workflow: WorkflowSettings) => taskSettingsService.saveWorkflow(actor, workflow), 'Workflow saved');

export const useSaveFields = () =>
  useSettingsMutation(
    (actor, fields: { issueTypes: IssueTypeSetting[]; priorities: PrioritySetting[] }) => taskSettingsService.saveFields(actor, fields),
    'Task types and priorities saved',
  );

// Saves the label list, then applies renames and removals to existing tasks
export const useSaveLabels = () =>
  useSettingsMutation(
    async (actor, { labels, renames, removals }: { labels: LabelSetting[]; renames: { from: string; to: string }[]; removals: string[] }) => {
      await taskSettingsService.saveLabels(actor, labels);
      for (const { from, to } of renames) await taskService.relabelTasks(actor, from, to);
      for (const name of removals) await taskService.relabelTasks(actor, name, null);
    },
    'Labels saved',
  );

export const useSavePermissions = () =>
  useSettingsMutation((actor, permissions: PermissionMatrix) => taskSettingsService.savePermissions(actor, permissions), 'Permissions saved');

export const useResetSettings = () =>
  useSettingsMutation(
    (actor, part: 'workflow' | 'fields' | 'labels' | 'permissions') => taskSettingsService.reset(actor, part),
    'Restored the default settings',
  );

/* ---------- Automation ---------- */

export function useAutomationRules() {
  const actor = useActor();
  return useQuery({ queryKey: AUTOMATION_KEY, queryFn: () => automationService.list(actor), enabled: can(actor, 'workflow.configure') });
}

function useRuleMutation<TVariables>(mutationFn: (actor: PermissionUser, variables: TVariables) => Promise<unknown>, successMessage: (variables: TVariables) => string) {
  const actor = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(actor, variables),
    onSuccess: (_result, variables) => {
      [AUTOMATION_KEY, AUDIT_KEY].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
      toast.success(successMessage(variables));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export const useCreateRule = () => useRuleMutation((actor, input: AutomationRuleInput) => automationService.create(actor, input), (input) => `"${input.name}" created`);

export const useUpdateRule = () =>
  useRuleMutation(
    (actor, { id, input }: { id: string; input: AutomationRuleInput }) => automationService.update(actor, id, input),
    ({ input }) => `"${input.name}" saved`,
  );

export const useDeleteRule = () =>
  useRuleMutation((actor, rule: { id: string; name: string }) => automationService.remove(actor, rule.id), (rule) => `"${rule.name}" deleted`);

/* ---------- Audit ---------- */

export function useAuditLog(filters: AuditFilters) {
  const actor = useActor();
  return useQuery({
    queryKey: [...AUDIT_KEY, filters],
    queryFn: () => auditService.list(actor, filters),
    enabled: can(actor, 'workflow.configure'),
  });
}
