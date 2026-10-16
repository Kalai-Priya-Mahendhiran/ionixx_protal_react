import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/toggle';
import { TASK_ISSUE_TYPES, TASK_PRIORITIES } from '@/lib/schemas';
import { formatRelativeTime } from '@/lib/utils';
import { getConfiguredLabels, getPriorityLabel, getStatusLabel, getTypeLabel, getWorkflowStatuses } from '@/lib/workflow';
import { validateRule, type AutomationRuleInput } from '@/services/apis/automation/automation-service';
import { useAutomationRules, useCreateRule, useDeleteRule, useUpdateRule } from '@/services/apis/settings/use-task-settings';
import { useProjects } from '@/services/apis/tasks/use-tasks';
import type { AutomationAction, AutomationCondition, AutomationRule, AutomationTrigger, ConditionField, Project } from '@/types';

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'task-created', label: 'a task is created' },
  { value: 'status-changed', label: 'a task moves to a status' },
  { value: 'assigned', label: 'a task is assigned' },
  { value: 'blocked', label: 'a task is flagged as blocked' },
  { value: 'due-date-passed', label: "a task's due date passes" },
];

const FIELDS: { value: ConditionField; label: string }[] = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'type', label: 'Type' },
  { value: 'project', label: 'Project' },
];

const RECIPIENTS: { value: Extract<AutomationAction, { kind: 'notify' }>['recipient']; label: string }[] = [
  { value: 'assignee', label: 'the assignee' },
  { value: 'reporter', label: 'the reporter' },
  { value: 'manager', label: "the assignee's manager" },
  { value: 'watchers', label: 'the watchers' },
];

const selectClass = 'h-9 rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30';

function valueOptions(field: ConditionField, projects: Project[]): { value: string; label: string }[] {
  switch (field) {
    case 'status':
      return getWorkflowStatuses(true).map((status) => ({ value: status.id, label: status.label }));
    case 'priority':
      return TASK_PRIORITIES.map((priority) => ({ value: priority, label: getPriorityLabel(priority) }));
    case 'type':
      return TASK_ISSUE_TYPES.map((type) => ({ value: type, label: getTypeLabel(type) }));
    case 'project':
      return projects.map((project) => ({ value: project.id, label: project.name }));
  }
}

// Plain-English summary, e.g. "When a task's due date passes · If Status is not Done · Then notify the assignee's manager"
function describeRule(rule: AutomationRuleInput, projects: Project[]) {
  const trigger =
    rule.trigger === 'status-changed'
      ? `a task moves to ${rule.triggerStatus ? getStatusLabel(rule.triggerStatus) : 'any status'}`
      : TRIGGERS.find((item) => item.value === rule.trigger)?.label;
  const conditions = rule.conditions.map((condition) => {
    const label = valueOptions(condition.field, projects).find((option) => option.value === condition.value)?.label ?? condition.value;
    return `${FIELDS.find((field) => field.value === condition.field)?.label} ${condition.operator === 'is' ? 'is' : 'is not'} ${label}`;
  });
  const actions = rule.actions.map((action) =>
    action.kind === 'notify'
      ? `notify ${RECIPIENTS.find((recipient) => recipient.value === action.recipient)?.label}`
      : action.kind === 'set-priority'
        ? `set priority to ${getPriorityLabel(action.priority)}`
        : `add label "${action.label}"`,
  );
  return { trigger, conditions, actions };
}

const emptyRule = (): AutomationRuleInput => ({
  name: '',
  enabled: true,
  trigger: 'due-date-passed',
  conditions: [{ field: 'status', operator: 'is-not', value: 'done' }],
  actions: [{ kind: 'notify', recipient: 'manager' }],
});

/* ---------- Editor ---------- */

function RuleEditor({ open, rule, onOpenChange }: { open: boolean; rule?: AutomationRule; onOpenChange: (open: boolean) => void }) {
  const { data: projects = [] } = useProjects();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const [draft, setDraft] = useState<AutomationRuleInput>(emptyRule);
  const [error, setError] = useState('');
  const saving = createRule.isPending || updateRule.isPending;

  useEffect(() => {
    if (!open) return;
    setError('');
    setDraft(rule ? { name: rule.name, enabled: rule.enabled, trigger: rule.trigger, triggerStatus: rule.triggerStatus, conditions: rule.conditions, actions: rule.actions } : emptyRule());
  }, [open, rule]);

  const setCondition = (index: number, changes: Partial<AutomationCondition>) =>
    setDraft({ ...draft, conditions: draft.conditions.map((condition, i) => (i === index ? { ...condition, ...changes } : condition)) });
  const setAction = (index: number, action: AutomationAction) => setDraft({ ...draft, actions: draft.actions.map((item, i) => (i === index ? action : item)) });

  const save = () => {
    try {
      validateRule(draft);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Check the rule');
      return;
    }
    const close = { onSuccess: () => onOpenChange(false) };
    if (rule) updateRule.mutate({ id: rule.id, input: draft }, close);
    else createRule.mutate(draft, close);
  };

  const { trigger, conditions, actions } = describeRule(draft, projects);

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-indigo-100 px-6 py-4 pr-12">
          <DialogTitle className="text-xl">{rule ? 'Edit rule' : 'New automation rule'}</DialogTitle>
          <DialogDescription>When something happens, if the task matches, then do something.</DialogDescription>
        </DialogHeader>
        <div className="ionixx-scrollbar flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-700">
              Rule name <span className="text-red-500">*</span>
            </span>
            <Input value={draft.name} maxLength={80} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Overdue work → tell the manager" autoFocus />
          </label>

          <section className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">When</h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={draft.trigger}
                onChange={(event) => setDraft({ ...draft, trigger: event.target.value as AutomationTrigger })}
                aria-label="When"
                className={selectClass}
              >
                {TRIGGERS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {draft.trigger === 'status-changed' && (
                <select value={draft.triggerStatus ?? ''} onChange={(event) => setDraft({ ...draft, triggerStatus: event.target.value || undefined })} aria-label="Status" className={selectClass}>
                  <option value="">any status</option>
                  {getWorkflowStatuses().map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {draft.trigger === 'due-date-passed' && <p className="text-xs text-gray-500">Checked automatically; fires once per task until its due date changes.</p>}
          </section>

          <section className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">If (all must match)</h3>
            {draft.conditions.length === 0 && <p className="text-sm text-gray-500">Any task.</p>}
            {draft.conditions.map((condition, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={condition.field}
                  onChange={(event) => {
                    const field = event.target.value as ConditionField;
                    setCondition(index, { field, value: valueOptions(field, projects)[0]?.value ?? '' });
                  }}
                  aria-label="Field"
                  className={selectClass}
                >
                  {FIELDS.map((field) => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <select value={condition.operator} onChange={(event) => setCondition(index, { operator: event.target.value as 'is' | 'is-not' })} aria-label="Operator" className={selectClass}>
                  <option value="is">is</option>
                  <option value="is-not">is not</option>
                </select>
                <select value={condition.value} onChange={(event) => setCondition(index, { value: event.target.value })} aria-label="Value" className={selectClass}>
                  {valueOptions(condition.field, projects).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, conditions: draft.conditions.filter((_, i) => i !== index) })}
                  aria-label="Remove condition"
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft({ ...draft, conditions: [...draft.conditions, { field: 'priority', operator: 'is', value: 'urgent' }] })}
              className="gap-1 text-[#464EB8]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add condition
            </Button>
          </section>

          <section className="space-y-2 rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Then</h3>
            {draft.actions.map((action, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={action.kind}
                  onChange={(event) => {
                    const kind = event.target.value as AutomationAction['kind'];
                    setAction(index, kind === 'notify' ? { kind, recipient: 'assignee' } : kind === 'set-priority' ? { kind, priority: 'high' } : { kind, label: '' });
                  }}
                  aria-label="Action"
                  className={selectClass}
                >
                  <option value="notify">Notify</option>
                  <option value="set-priority">Set priority to</option>
                  <option value="add-label">Add label</option>
                </select>
                {action.kind === 'notify' && (
                  <select value={action.recipient} onChange={(event) => setAction(index, { kind: 'notify', recipient: event.target.value as typeof action.recipient })} aria-label="Recipient" className={selectClass}>
                    {RECIPIENTS.map((recipient) => (
                      <option key={recipient.value} value={recipient.value}>
                        {recipient.label}
                      </option>
                    ))}
                  </select>
                )}
                {action.kind === 'set-priority' && (
                  <select value={action.priority} onChange={(event) => setAction(index, { kind: 'set-priority', priority: event.target.value as typeof action.priority })} aria-label="Priority" className={selectClass}>
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {getPriorityLabel(priority)}
                      </option>
                    ))}
                  </select>
                )}
                {action.kind === 'add-label' && (
                  <>
                    <Input
                      value={action.label}
                      onChange={(event) => setAction(index, { kind: 'add-label', label: event.target.value })}
                      list="automation-labels"
                      placeholder="label"
                      aria-label="Label"
                      className="h-9 w-44"
                    />
                    <datalist id="automation-labels">
                      {getConfiguredLabels().map((label) => (
                        <option key={label} value={label} />
                      ))}
                    </datalist>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, actions: draft.actions.filter((_, i) => i !== index) })}
                  aria-label="Remove action"
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft({ ...draft, actions: [...draft.actions, { kind: 'notify', recipient: 'assignee' }] })}
              className="gap-1 text-[#464EB8]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add action
            </Button>
          </section>

          <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <b>When</b> {trigger}
            {conditions.length > 0 && (
              <>
                {' '}
                · <b>If</b> {conditions.join(' and ')}
              </>
            )}{' '}
            · <b>Then</b> {actions.length > 0 ? actions.join(', ') : '…'}
          </p>
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-indigo-100 bg-gray-50/60 px-6 py-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <Switch checked={draft.enabled} onCheckedChange={(enabled) => setDraft({ ...draft, enabled })} className="data-[state=checked]:bg-[#464EB8]" />
            Rule is on
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              {saving ? 'Saving…' : rule ? 'Save rule' : 'Create rule'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- List ---------- */

export function AutomationSettingsSection() {
  const { data: rules = [], isLoading } = useAutomationRules();
  const { data: projects = [] } = useProjects();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const [editor, setEditor] = useState<{ open: boolean; rule?: AutomationRule }>({ open: false });
  const [deleting, setDeleting] = useState<AutomationRule | null>(null);

  const toggle = (rule: AutomationRule, enabled: boolean) =>
    updateRule.mutate({ id: rule.id, input: { name: rule.name, enabled, trigger: rule.trigger, triggerStatus: rule.triggerStatus, conditions: rule.conditions, actions: rule.actions } });

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Automation</h2>
            <p className="mt-1 text-sm text-gray-600">Rules that react to task events. Notifications from rules come from “Automation”.</p>
          </div>
          <Button onClick={() => setEditor({ open: true })} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            <Plus className="h-4 w-4" />
            New rule
          </Button>
        </div>

        {isLoading && <div className="h-32 animate-pulse rounded-lg bg-gray-100" />}
        {!isLoading && rules.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">No rules yet. Create one to automate reminders and clean-up.</p>
        )}

        <ul className="space-y-3">
          {rules.map((rule) => {
            const { trigger, conditions, actions } = describeRule(rule, projects);
            return (
              <li key={rule.id} className="flex flex-wrap items-start gap-4 rounded-lg border border-gray-200 p-4">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Zap className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-semibold text-gray-900">{rule.name}</p>
                  <p className="text-sm text-gray-700">
                    <b>When</b> {trigger}
                    {conditions.length > 0 && <> · <b>If</b> {conditions.join(' and ')}</>} · <b>Then</b> {actions.join(', ')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ran {rule.runCount} {rule.runCount === 1 ? 'time' : 'times'}
                    {rule.lastRunAt && ` · last ${formatRelativeTime(rule.lastRunAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(enabled) => toggle(rule, enabled)}
                    aria-label={`${rule.name} is ${rule.enabled ? 'on' : 'off'}`}
                    className="data-[state=checked]:bg-[#464EB8]"
                  />
                  <Button variant="ghost" size="sm" onClick={() => setEditor({ open: true, rule })} aria-label={`Edit ${rule.name}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(rule)} aria-label={`Delete ${rule.name}`} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <RuleEditor open={editor.open} rule={editor.rule} onOpenChange={(open) => !open && setEditor((current) => ({ ...current, open: false }))} />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="The rule stops running. Changes it already made stay."
        confirmLabel="Delete rule"
        destructive
        loading={deleteRule.isPending}
        onConfirm={() => deleting && deleteRule.mutate(deleting, { onSettled: () => setDeleting(null) })}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </Card>
  );
}
