import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/toggle';
import { cloneSettings, defaultLabelColor } from '@/lib/task-settings-defaults';
import { cn } from '@/lib/utils';
import { LABEL_COLOR_CLASSES } from '@/lib/workflow';
import { useResetSettings, useSaveFields, useSaveLabels, useTaskSettings } from '@/services/apis/settings/use-task-settings';
import { useTasks } from '@/services/apis/tasks/use-tasks';
import type { IssueTypeSetting, LabelColor, PrioritySetting } from '@/types';
import { TaskTypeGlyph } from '../sections/task-badges';
import { TASK_PRIORITY_CONFIG } from '../sections/task-config';
import { SettingsPanel } from './settings-panel';

const LABEL_COLORS = Object.keys(LABEL_COLOR_CLASSES) as LabelColor[];
const taskCount = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`;

// A label row remembers its saved name, so a rename can be applied to existing tasks
interface LabelRow {
  key: string;
  name: string;
  color: LabelColor;
  originalName?: string;
}

/* ---------- Types and priorities ---------- */

function TypesAndPriorities() {
  const { data: settings } = useTaskSettings();
  const saveFields = useSaveFields();
  const resetSettings = useResetSettings();
  const [types, setTypes] = useState<IssueTypeSetting[]>([]);
  const [priorities, setPriorities] = useState<PrioritySetting[]>([]);

  useEffect(() => {
    if (!settings) return;
    setTypes(cloneSettings(settings.issueTypes));
    setPriorities(cloneSettings(settings.priorities));
  }, [settings]);

  if (!settings) return null;
  const dirty = JSON.stringify(types) !== JSON.stringify(settings.issueTypes) || JSON.stringify(priorities) !== JSON.stringify(settings.priorities);

  return (
    <SettingsPanel
      title="Task types and priorities"
      description="Rename them to match how your teams talk. Turned-off types aren't offered for new tasks; existing tasks keep their type."
      dirty={dirty}
      saving={saveFields.isPending}
      onSave={() => saveFields.mutate({ issueTypes: types, priorities })}
      onDiscard={() => {
        setTypes(cloneSettings(settings.issueTypes));
        setPriorities(cloneSettings(settings.priorities));
      }}
      onReset={() => resetSettings.mutate('fields')}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Task types</h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {types.map((item) => (
              <li key={item.type} className={cn('flex items-center gap-3 px-3 py-2', !item.enabled && 'bg-gray-50')}>
                <TaskTypeGlyph type={item.type} />
                <Input
                  value={item.label}
                  maxLength={24}
                  onChange={(event) => setTypes(types.map((type) => (type.type === item.type ? { ...type, label: event.target.value } : type)))}
                  aria-label={`Name for ${item.type}`}
                  className="h-8 flex-1"
                />
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(enabled) => setTypes(types.map((type) => (type.type === item.type ? { ...type, enabled } : type)))}
                  aria-label={`Offer ${item.label} for new tasks`}
                  className="data-[state=checked]:bg-[#464EB8]"
                />
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Priorities</h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {[...priorities].reverse().map((item) => {
              const { icon: Icon, className } = TASK_PRIORITY_CONFIG[item.priority];
              return (
                <li key={item.priority} className="flex items-center gap-3 px-3 py-2">
                  <Icon className={cn('h-4 w-4 shrink-0', className)} />
                  <Input
                    value={item.label}
                    maxLength={24}
                    onChange={(event) =>
                      setPriorities(priorities.map((priority) => (priority.priority === item.priority ? { ...priority, label: event.target.value } : priority)))
                    }
                    aria-label={`Name for ${item.priority} priority`}
                    className="h-8 flex-1"
                  />
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-gray-500">The four levels and their order are fixed, so sorting and automation keep working.</p>
        </section>
      </div>
    </SettingsPanel>
  );
}

/* ---------- Labels ---------- */

function Labels() {
  const { data: settings } = useTaskSettings();
  const { data: tasks = [] } = useTasks();
  const saveLabels = useSaveLabels();
  const resetSettings = useResetSettings();
  const [rows, setRows] = useState<LabelRow[]>([]);

  const fromSettings = (): LabelRow[] =>
    (settings?.labels ?? []).map((label) => ({ key: label.name, name: label.name, color: label.color, originalName: label.name }));

  useEffect(() => {
    if (settings) setRows(fromSettings());
    // fromSettings only reads settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    tasks.forEach((task) => task.labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1)));
    return counts;
  }, [tasks]);

  if (!settings) return null;
  const normalized = rows.map((row) => ({ name: row.name.trim().toLowerCase(), color: row.color }));
  const dirty = JSON.stringify(normalized) !== JSON.stringify(settings.labels);
  const removals = settings.labels.map((label) => label.name).filter((name) => !rows.some((row) => row.originalName === name));
  const renames = rows
    .filter((row) => row.originalName && row.originalName !== row.name.trim().toLowerCase())
    .map((row) => ({ from: row.originalName!, to: row.name.trim().toLowerCase() }));
  const affected = [...removals, ...renames.map((rename) => rename.from)].reduce((sum, name) => sum + (usage.get(name) ?? 0), 0);

  const update = (key: string, changes: Partial<LabelRow>) => setRows(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  return (
    <SettingsPanel
      title="Labels"
      description="Suggested labels and their colours. Renaming or deleting a label here updates every task that uses it."
      dirty={dirty}
      saving={saveLabels.isPending}
      onSave={() => saveLabels.mutate({ labels: normalized, renames, removals })}
      onDiscard={() => setRows(fromSettings())}
      onReset={() => resetSettings.mutate('labels')}
      resetDescription="Restores the default label list and colours. Labels already on tasks stay on them."
    >
      {affected > 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Saving will update {affected} task {affected === 1 ? 'label' : 'labels'}: {[...renames.map((rename) => `${rename.from} → ${rename.to}`), ...removals.map((name) => `remove ${name}`)].join(', ')}.
        </p>
      )}
      <ul className="grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <li key={row.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-200 px-3 py-2">
            <Input
              value={row.name}
              maxLength={30}
              onChange={(event) => update(row.key, { name: event.target.value.toLowerCase().replace(/\s+/g, '-') })}
              aria-label={`Label ${row.name}`}
              className="h-8 w-40 min-w-0"
            />
            <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Colour of ${row.name}`}>
              {LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={row.color === color}
                  aria-label={color}
                  onClick={() => update(row.key, { color })}
                  className={cn('h-4 w-4 rounded-full border border-white', LABEL_COLOR_CLASSES[color].split(' ')[0], row.color === color && 'ring-2 ring-gray-900 ring-offset-1')}
                />
              ))}
            </div>
            <span className={cn('ml-auto rounded px-1.5 py-0.5 text-xs font-semibold', LABEL_COLOR_CLASSES[row.color])}>{row.name || '…'}</span>
            <span className="w-14 text-right text-xs text-gray-500">{taskCount(usage.get(row.originalName ?? '') ?? 0)}</span>
            <button
              type="button"
              onClick={() => setRows(rows.filter((item) => item.key !== row.key))}
              aria-label={`Delete ${row.name}`}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const name = `new-label-${rows.length + 1}`;
          setRows([...rows, { key: `${name}-${Date.now()}`, name, color: defaultLabelColor(name) }]);
        }}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add label
      </Button>
    </SettingsPanel>
  );
}

export function FieldsSettingsSection() {
  return (
    <div className="space-y-6">
      <TypesAndPriorities />
      <Labels />
    </div>
  );
}
