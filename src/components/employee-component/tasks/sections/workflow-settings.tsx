import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, Lock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/toggle';
import { cloneSettings } from '@/lib/task-settings-defaults';
import { cn } from '@/lib/utils';
import { LOCKED_STATUSES, STATUS_COLOR_CLASSES } from '@/lib/workflow';
import { useResetSettings, useSaveWorkflow, useTaskSettings } from '@/services/apis/settings/use-task-settings';
import { useTasks } from '@/services/apis/tasks/use-tasks';
import type { StatusCategory, StatusColor, WorkflowSettings, WorkflowStatus } from '@/types';
import { SettingsPanel } from './settings-panel';
import { PICKABLE_STATUS_CATEGORIES, STATUS_CATEGORY_LABELS } from '@/lib/constants';

const COLORS = Object.keys(STATUS_COLOR_CLASSES) as StatusColor[];

const OWN_COLUMN = '__own__';

// "Waiting for QA" -> "waiting-for-qa", made unique within the workflow
function makeStatusId(label: string, existing: string[]): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'status';
  let id = base;
  for (let n = 2; existing.includes(id); n += 1) id = `${base}-${n}`;
  return id;
}

export function WorkflowSettingsSection() {
  const { data: settings } = useTaskSettings();
  const { data: tasks = [] } = useTasks();
  const saveWorkflow = useSaveWorkflow();
  const resetSettings = useResetSettings();
  const [draft, setDraft] = useState<WorkflowSettings | null>(null);

  useEffect(() => {
    if (settings) setDraft(cloneSettings(settings.workflow));
  }, [settings]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => counts.set(task.status, (counts.get(task.status) ?? 0) + 1));
    return counts;
  }, [tasks]);

  if (!settings || !draft) return <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.workflow);
  const enabled = draft.statuses.filter((status) => status.enabled);
  const columnOptions = draft.statuses.filter((status) => !status.boardColumn && status.enabled);

  const updateStatus = (id: string, changes: Partial<WorkflowStatus>) =>
    setDraft({ ...draft, statuses: draft.statuses.map((status) => (status.id === id ? { ...status, ...changes } : status)) });

  const move = (index: number, offset: number) => {
    const statuses = [...draft.statuses];
    const [moved] = statuses.splice(index, 1);
    statuses.splice(index + offset, 0, moved);
    setDraft({ ...draft, statuses });
  };

  const addStatus = () => {
    const id = makeStatusId('New status', draft.statuses.map((status) => status.id));
    const others = draft.statuses.filter((status) => status.enabled).map((status) => status.id);
    // New statuses go just before Done, where work usually needs an extra step
    const doneIndex = Math.max(0, draft.statuses.findIndex((status) => status.id === 'done'));
    setDraft({
      statuses: [
        ...draft.statuses.slice(0, doneIndex),
        { id, label: 'New status', color: 'teal', category: 'active', enabled: true, system: false },
        ...draft.statuses.slice(doneIndex),
      ],
      // A new status can be reached from any open status and can move anywhere open
      transitions: {
        ...Object.fromEntries(Object.entries(draft.transitions).map(([from, targets]) => [from, from === 'done' ? targets : [...targets, id]])),
        [id]: others.filter((other) => other !== 'reopened'),
      },
    });
  };

  const removeStatus = (id: string) => {
    const transitions = Object.fromEntries(Object.entries(draft.transitions).filter(([from]) => from !== id));
    setDraft({
      statuses: draft.statuses.filter((status) => status.id !== id).map((status) => (status.boardColumn === id ? { ...status, boardColumn: undefined } : status)),
      transitions: Object.fromEntries(Object.entries(transitions).map(([from, targets]) => [from, targets.filter((to) => to !== id)])),
    });
  };

  const toggleTransition = (from: string, to: string) => {
    const current = draft.transitions[from] ?? [];
    setDraft({ ...draft, transitions: { ...draft.transitions, [from]: current.includes(to) ? current.filter((item) => item !== to) : [...current, to] } });
  };

  const setRow = (from: string, allow: boolean) =>
    setDraft({ ...draft, transitions: { ...draft.transitions, [from]: allow ? enabled.filter((status) => status.id !== from).map((status) => status.id) : [] } });

  // Columns as they'll appear on the board
  const preview = columnOptions.map((column) => ({
    column,
    grouped: enabled.filter((status) => status.boardColumn === column.id),
  }));

  return (
    <SettingsPanel
      title="Workflow"
      description={
        <>
          The statuses tasks move through and which moves are allowed. The board, status menus, filters and bulk actions follow this. <b>To Do</b> (where new tasks
          start) and <b>Done</b> are always on; <b>In Review</b> is the approval step.
        </>
      }
      dirty={dirty}
      saving={saveWorkflow.isPending}
      onSave={() => saveWorkflow.mutate(draft)}
      onDiscard={() => setDraft(cloneSettings(settings.workflow))}
      onReset={() => resetSettings.mutate('workflow')}
      resetDescription="Restores To Do → In Progress → In Review → Done (+ Reopened) and the default transitions. Tasks in custom statuses keep them until moved."
    >
      {/* Statuses */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Statuses ({enabled.length} in use)</h3>
          <Button variant="outline" size="sm" onClick={addStatus} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add status
          </Button>
        </div>
        <div className="app-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
              <tr>
                <th className="w-16 px-3 py-2">Order</th>
                <th className="px-3 py-2">Name & colour</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Board column</th>
                <th className="px-3 py-2 text-right">Tasks</th>
                <th className="px-3 py-2">In use</th>
                <th className="w-12 px-3 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {draft.statuses.map((status, index) => {
                const locked = LOCKED_STATUSES.includes(status.id);
                const count = usage.get(status.id) ?? 0;
                return (
                  <tr key={status.id} className={cn(!status.enabled && 'bg-gray-50 text-gray-400')}>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5">
                        <button type="button" aria-label={`Move ${status.label} up`} disabled={index === 0} onClick={() => move(index, -1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${status.label} down`}
                          disabled={index === draft.statuses.length - 1}
                          onClick={() => move(index, 1)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Input
                          value={status.label}
                          maxLength={30}
                          onChange={(event) => updateStatus(status.id, { label: event.target.value })}
                          aria-label={`Name of ${status.label}`}
                          className="h-8 w-40"
                        />
                        <div className="flex gap-1" role="radiogroup" aria-label={`Colour of ${status.label}`}>
                          {COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              role="radio"
                              aria-checked={status.color === color}
                              aria-label={color}
                              onClick={() => updateStatus(status.id, { color })}
                              className={cn('h-4 w-4 rounded-full', STATUS_COLOR_CLASSES[color].dot, status.color === color && 'ring-2 ring-gray-900 ring-offset-1')}
                            />
                          ))}
                        </div>
                        <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', STATUS_COLOR_CLASSES[status.color].badge)}>{status.label || '…'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {status.system ? (
                        <span className="text-gray-600">{STATUS_CATEGORY_LABELS[status.category]}</span>
                      ) : (
                        <Select value={status.category} onValueChange={(category) => updateStatus(status.id, { category: category as StatusCategory })}>
                          <SelectTrigger className="h-8 w-40" aria-label={`Kind of ${status.label}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PICKABLE_STATUS_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {STATUS_CATEGORY_LABELS[category]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={status.boardColumn ?? OWN_COLUMN}
                        onValueChange={(value) => updateStatus(status.id, { boardColumn: value === OWN_COLUMN ? undefined : value })}
                        disabled={locked || draft.statuses.some((other) => other.boardColumn === status.id)}
                      >
                        <SelectTrigger className="h-8 w-44" aria-label={`Board column for ${status.label}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={OWN_COLUMN}>Own column</SelectItem>
                          {columnOptions
                            .filter((column) => column.id !== status.id)
                            .map((column) => (
                              <SelectItem key={column.id} value={column.id}>
                                Inside "{column.label}"
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{count}</td>
                    <td className="px-3 py-2">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500" title="Always on">
                          <Lock className="h-3.5 w-3.5" />
                          Always
                        </span>
                      ) : (
                        <Switch
                          checked={status.enabled}
                          onCheckedChange={(checked) => updateStatus(status.id, { enabled: checked })}
                          aria-label={`Use ${status.label}`}
                          className="data-[state=checked]:bg-[#464EB8]"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {!status.system && (
                        <button
                          type="button"
                          onClick={() => removeStatus(status.id)}
                          disabled={count > 0}
                          title={count > 0 ? `Move the ${count} tasks out of ${status.label} first, or turn it off` : `Remove ${status.label}`}
                          aria-label={`Remove ${status.label}`}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transitions */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Allowed moves</h3>
        <p className="text-sm text-gray-600">
          Tick where a task may go next from each status. Moving <b>In Review → Done</b> also needs approval rights (Permissions).
        </p>
        <div className="app-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
          <table className="text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">
                  From <ArrowRight className="inline h-3 w-3" /> to
                </th>
                {enabled.map((status) => (
                  <th key={status.id} className="px-3 py-2 text-center">
                    <span className={cn('whitespace-nowrap rounded px-2 py-0.5', STATUS_COLOR_CLASSES[status.color].badge)}>{status.label}</span>
                  </th>
                ))}
                <th className="px-3 py-2">
                  <span className="sr-only">Row actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enabled.map((from) => (
                <tr key={from.id}>
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-800">
                    {from.label}
                  </th>
                  {enabled.map((to) => (
                    <td key={to.id} className="px-3 py-2 text-center">
                      {from.id === to.id ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <input
                          type="checkbox"
                          checked={(draft.transitions[from.id] ?? []).includes(to.id)}
                          onChange={() => toggleTransition(from.id, to.id)}
                          aria-label={`Allow ${from.label} to ${to.label}`}
                          className="h-4 w-4 cursor-pointer accent-[#464EB8]"
                        />
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    <button type="button" onClick={() => setRow(from.id, true)} className="font-medium text-[#464EB8] hover:underline">
                      All
                    </button>
                    {' · '}
                    <button type="button" onClick={() => setRow(from.id, false)} className="font-medium text-gray-500 hover:underline">
                      None
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Board preview */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Board preview</h3>
        <div className="flex flex-wrap gap-3">
          {preview.map(({ column, grouped }) => (
            <div key={column.id} className="min-w-[140px] rounded-lg bg-indigo-50/60 p-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <span className={cn('h-2 w-2 rounded-full', STATUS_COLOR_CLASSES[column.color].dot)} />
                {column.label}
              </p>
              {grouped.length > 0 && <p className="mt-1 text-xs text-gray-500">also shows: {grouped.map((status) => status.label).join(', ')}</p>}
            </div>
          ))}
        </div>
      </section>
    </SettingsPanel>
  );
}
