import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@/lib/mock-users';
import { DEFAULT_PERMISSION_MATRIX, cloneSettings } from '@/lib/task-settings-defaults';
import { cn } from '@/lib/utils';
import { useResetSettings, useSavePermissions, useTaskSettings } from '@/services/apis/settings/use-task-settings';
import type { PermissionMatrix, PermissionScope, TaskAction } from '@/types';
import { SettingsPanel } from './settings-panel';

const ROLES: UserRole[] = ['employee', 'project_manager', 'hr', 'admin', 'system_admin', 'executive'];

const ACTION_GROUPS: { title: string; actions: { action: TaskAction; label: string; hint: string }[] }[] = [
  {
    title: 'Tasks',
    actions: [
      { action: 'task.view', label: 'View tasks', hint: 'Which tasks they can see at all' },
      { action: 'task.create', label: 'Create tasks', hint: 'For whom they can create tasks' },
      { action: 'task.assign', label: 'Assign to others', hint: 'Who they can assign work to' },
      { action: 'task.edit', label: 'Edit tasks', hint: 'Change title, dates, priority…' },
      { action: 'task.changeStatus', label: 'Change status', hint: 'Move tasks through the workflow' },
      { action: 'task.delete', label: 'Delete tasks', hint: 'Remove tasks permanently' },
      { action: 'task.approve', label: 'Approve (In Review → Done)', hint: 'Sign off finished work' },
      { action: 'task.comment', label: 'Comment', hint: 'Add comments and @mentions' },
      { action: 'task.logWork', label: 'Log work', hint: 'Record hours against tasks' },
      { action: 'task.watch', label: 'Watch', hint: 'Follow tasks for notifications' },
    ],
  },
  {
    title: 'Planning & administration',
    actions: [
      { action: 'sprint.manage', label: 'Plan sprints', hint: 'Create, start and complete sprints' },
      { action: 'template.manage', label: 'HR templates', hint: 'Edit and apply checklist templates' },
      { action: 'project.manage', label: 'Manage projects', hint: 'Create projects, members, move tasks' },
      { action: 'workflow.configure', label: 'Task settings', hint: 'This page' },
      { action: 'reports.view', label: 'Reports', hint: 'Which work appears in their reports' },
    ],
  },
];

const SCOPE_OPTIONS: { value: PermissionScope; label: string; hint: string }[] = [
  { value: 'none', label: 'No', hint: 'Never' },
  { value: 'own', label: 'Own', hint: 'Tasks assigned to or reported by them' },
  { value: 'team', label: 'Team', hint: 'Their direct reports’ tasks' },
  { value: 'hr', label: 'HR only', hint: 'HR-type tasks' },
  { value: 'all', label: 'All', hint: 'Every task' },
];

const SCOPE_STYLE: Record<PermissionScope, string> = {
  none: 'text-gray-400',
  own: 'text-sky-700',
  team: 'text-indigo-700',
  hr: 'text-pink-700',
  all: 'text-green-700',
};

// Settings access for System Admin can't be removed, or nobody could undo it
const isLocked = (action: TaskAction, role: UserRole) => action === 'workflow.configure' && role === 'system_admin';

export function PermissionsSettingsSection() {
  const { data: settings } = useTaskSettings();
  const savePermissions = useSavePermissions();
  const resetSettings = useResetSettings();
  const [draft, setDraft] = useState<PermissionMatrix | null>(null);

  useEffect(() => {
    if (settings) setDraft(cloneSettings(settings.permissions));
  }, [settings]);

  if (!settings || !draft) return <div className="h-96 animate-pulse rounded-xl bg-white shadow-sm" />;
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.permissions);
  const changedCount = ACTION_GROUPS.flatMap((group) => group.actions).reduce(
    (sum, { action }) => sum + ROLES.filter((role) => draft[action][role] !== settings.permissions[action][role]).length,
    0,
  );

  const setScope = (action: TaskAction, role: UserRole, scope: PermissionScope) =>
    setDraft({ ...draft, [action]: { ...draft[action], [role]: scope } });

  return (
    <SettingsPanel
      title="Permissions"
      description={
        <>
          What each role may do, and on which tasks. <b>Own</b> = assigned to or reported by them, <b>Team</b> = their direct reports, <b>HR only</b> = HR-type
          tasks. Changes apply immediately to every screen. The backend must enforce the same matrix.
        </>
      }
      dirty={dirty}
      saving={savePermissions.isPending}
      onSave={() => savePermissions.mutate(draft)}
      onDiscard={() => setDraft(cloneSettings(settings.permissions))}
      onReset={() => resetSettings.mutate('permissions')}
      resetDescription="Restores the permission matrix the portal ships with."
    >
      {dirty && <p className="text-sm text-indigo-800">{changedCount} {changedCount === 1 ? 'cell' : 'cells'} changed (highlighted).</p>}
      <div className="ionixx-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Action</th>
              {ROLES.map((role) => (
                <th key={role} className="px-2 py-2 text-center">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          {ACTION_GROUPS.map((group) => (
            <tbody key={group.title} className="divide-y divide-gray-100">
              <tr className="bg-indigo-50/40">
                <th colSpan={ROLES.length + 1} className="px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  {group.title}
                </th>
              </tr>
              {group.actions.map(({ action, label, hint }) => (
                <tr key={action}>
                  <th scope="row" className="px-3 py-2 text-left font-normal">
                    <span className="block font-medium text-gray-900">{label}</span>
                    <span className="block text-xs text-gray-500">{hint}</span>
                  </th>
                  {ROLES.map((role) => {
                    const scope = draft[action][role];
                    const changed = scope !== settings.permissions[action][role];
                    const isDefault = scope === DEFAULT_PERMISSION_MATRIX[action][role];
                    return (
                      <td key={role} className={cn('px-2 py-2 text-center', changed && 'bg-amber-50')}>
                        {isLocked(action, role) ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700" title="Always — prevents locking everyone out of Settings">
                            <Lock className="h-3 w-3" />
                            All
                          </span>
                        ) : (
                          <select
                            value={scope}
                            onChange={(event) => setScope(action, role, event.target.value as PermissionScope)}
                            aria-label={`${label} for ${ROLE_LABELS[role]}`}
                            title={isDefault ? 'Default' : `Default: ${DEFAULT_PERMISSION_MATRIX[action][role]}`}
                            className={cn(
                              'w-[5.5rem] rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30',
                              SCOPE_STYLE[scope],
                            )}
                          >
                            {SCOPE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value} title={option.hint}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </SettingsPanel>
  );
}
