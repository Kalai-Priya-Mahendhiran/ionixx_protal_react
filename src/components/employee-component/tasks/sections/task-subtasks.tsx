import { useState, type FormEvent } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldClass } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { can, canCreateSubtask, firstAllowedStatus, getAssignableUsers } from '@/lib/permissions/task-permissions';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useChangeTaskStatus, useCreateSubtask, useDeleteTask, useProjects, useUpdateTaskField } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { TaskStatusBadge } from './task-badges';
import { progressPercent, toUpdateInput } from './task-utils';

interface TaskSubtasksProps {
  parent: Task;
  subtasks: Task[];
  onOpen: (task: Task) => void;
}

export function TaskSubtasks({ parent, subtasks, onOpen }: TaskSubtasksProps) {
  const { user } = useAuth();
  const changeStatus = useChangeTaskStatus({ silent: true });
  const createSubtask = useCreateSubtask();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(user?.id ?? '');

  const done = subtasks.filter((subtask) => subtask.status === 'done').length;
  const percent = progressPercent({ done, total: subtasks.length });
  const canAdd = !!user && can(user, 'task.edit', parent);
  // Only people the user may create work for; employees get just themselves
  const assignees = getAssignableUsers(user).filter((member) => canCreateSubtask(user, parent, member.id));

  // Ticking moves to Done; unticking goes back to To Do, or Reopened when the workflow only allows that from Done
  const toggleTarget = (subtask: Task) =>
    firstAllowedStatus(user, subtask, subtask.status === 'done' ? ['todo', 'reopened', 'in-progress'] : ['done']);

  const toggle = (subtask: Task) => {
    const next = toggleTarget(subtask);
    if (next) changeStatus.mutate({ task: subtask, status: next });
  };

  // Sub-tasks are edited right here: rename, reassign, remove
  const updateSubtask = useUpdateTaskField();
  const deleteSubtask = useDeleteTask();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const canEditSubtask = (subtask: Task) => can(user, 'task.edit', subtask);
  // Project members can hand sub-tasks to teammates on the same project
  const { data: projects = [] } = useProjects();
  const project = projects.find((item) => item.id === parent.projectId);
  const teammates = user && project?.memberIds.includes(user.id) ? getActiveUsers().filter((member) => project.memberIds.includes(member.id)) : [];
  const reassignOptions = [...assignees, ...teammates].filter((member, index, all) => all.findIndex((other) => other.id === member.id) === index);
  const canReassignSubtask = (subtask: Task) => canEditSubtask(subtask) && (can(user, 'task.assign') || teammates.length > 0);

  const rename = (subtask: Task) => {
    const next = draftTitle.trim();
    if (!next) return;
    if (next === subtask.title) {
      setRenamingId(null);
      return;
    }
    updateSubtask.mutate(
      { id: subtask.id, input: { ...toUpdateInput(subtask), title: next } },
      {
        onSuccess: () => {
          setRenamingId(null);
          toast.success(`${subtask.key} renamed`);
        },
      },
    );
  };

  const reassign = (subtask: Task, assigneeId: string) => {
    if (assigneeId === subtask.assigneeId) return;
    updateSubtask.mutate(
      { id: subtask.id, input: { ...toUpdateInput(subtask), assigneeId } },
      { onSuccess: () => toast.success(`${subtask.key} assigned to ${getUserById(assigneeId)?.name ?? 'them'}`) },
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    createSubtask.mutate(
      { parent, title, assigneeId },
      {
        onSuccess: () => {
          // Stay open for the next item, like ticking through a checklist
          setTitle('');
        },
      },
    );
  };

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">
        Sub-tasks {subtasks.length > 0 && <span className="font-normal text-gray-500">({done}/{subtasks.length} done)</span>}
      </h2>

      {subtasks.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Sub-task progress">
            <div className={cn('h-full rounded-full transition-all', percent === 100 ? 'bg-green-500' : 'bg-[#464EB8]')} style={{ width: `${percent}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600">{percent}%</span>
        </div>
      )}

      {subtasks.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {subtasks.map((subtask) => {
            const isDone = subtask.status === 'done';
            const canToggle = !!toggleTarget(subtask);
            const assignee = getUserById(subtask.assigneeId);
            return (
              <li key={subtask.id} className="flex items-center gap-3 px-3 py-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`Mark ${subtask.key} as ${isDone ? 'not done' : 'done'}`}
                  disabled={!canToggle}
                  onClick={() => toggle(subtask)}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    isDone ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white hover:border-[#464EB8]',
                  )}
                >
                  {isDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
                {renamingId === subtask.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      rename(subtask);
                    }}
                  >
                    <Input
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      onKeyDown={(event) => event.key === 'Escape' && setRenamingId(null)}
                      aria-label={`Rename ${subtask.key}`}
                      maxLength={200}
                      className={cn(fieldClass, 'h-8 flex-1 text-sm')}
                      autoFocus
                    />
                    <Button type="submit" size="sm" disabled={!draftTitle.trim()} className="h-8 bg-[#464EB8] px-2 text-white hover:bg-[#3a3f9a]" aria-label="Save">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setRenamingId(null)} className="h-8 px-2" aria-label="Cancel">
                      <X className="h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <button type="button" onClick={() => onOpen(subtask)} className="min-w-0 flex-1 text-left">
                    <span className="mr-2 text-xs font-semibold text-[#464EB8]">{subtask.key}</span>
                    <span className={cn('text-sm', isDone ? 'text-gray-400 line-through' : 'text-gray-800 hover:underline')}>{subtask.title}</span>
                  </button>
                )}
                {!isDone && subtask.status !== 'todo' && <TaskStatusBadge status={subtask.status} />}
                {canEditSubtask(subtask) && renamingId !== subtask.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(subtask.id);
                      setDraftTitle(subtask.title);
                    }}
                    aria-label={`Rename ${subtask.key}`}
                    title="Rename"
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
                {canReassignSubtask(subtask) ? (
                  <Select value={subtask.assigneeId} onValueChange={(next) => reassign(subtask, next)}>
                    <SelectTrigger
                      aria-label={`Assignee of ${subtask.key}`}
                      title={`${assignee?.name ?? 'Unassigned'} — click to reassign`}
                      className="h-7 w-auto gap-1 border-transparent px-1 shadow-none hover:bg-gray-100 [&>svg]:h-3 [&>svg]:w-3"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                        {getInitials(assignee?.name ?? '?')}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {(reassignOptions.some((member) => member.id === subtask.assigneeId) || !assignee ? reassignOptions : [assignee, ...reassignOptions]).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.id === user?.id ? `${member.name} (me)` : member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    title={assignee?.name}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                  >
                    {getInitials(assignee?.name ?? '?')}
                  </span>
                )}
                {can(user, 'task.delete', subtask) && (
                  <button
                    type="button"
                    onClick={() => setToDelete(subtask)}
                    aria-label={`Delete ${subtask.key}`}
                    title="Delete sub-task"
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {subtasks.length === 0 && !canAdd && <p className="text-sm text-gray-500">No sub-tasks.</p>}

      {canAdd && !isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-[#464EB8]/50 hover:bg-indigo-50/50 hover:text-[#464EB8]"
        >
          <Plus className="h-4 w-4" />
          {subtasks.length === 0 ? 'Add sub-task — break this task into smaller steps' : 'Add sub-task'}
        </button>
      )}

      {isAdding && (
        <form onSubmit={submit} className="flex flex-col gap-2 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 sm:flex-row">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            maxLength={200}
            className={cn(fieldClass, 'flex-1')}
            autoFocus
            onKeyDown={(event) => event.key === 'Escape' && setIsAdding(false)}
          />
          {assignees.length > 1 && (
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className={cn(fieldClass, 'sm:w-44')} aria-label="Sub-task assignee">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignees.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.id === user?.id ? `${member.name} (me)` : member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={!title.trim() || createSubtask.isPending} className="h-10 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              {createSubtask.isPending ? 'Adding…' : 'Add'}
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setIsAdding(false)}>
              Done
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${toDelete?.key ?? 'sub-task'}?`}
        description={
          <>
            <span className="font-medium text-gray-900">{toDelete?.title}</span> will be permanently removed. This can't be undone.
          </>
        }
        confirmLabel="Delete sub-task"
        destructive
        loading={deleteSubtask.isPending}
        onConfirm={() => toDelete && deleteSubtask.mutate(toDelete, { onSettled: () => setToDelete(null) })}
        onOpenChange={(open) => !open && setToDelete(null)}
      />
    </section>
  );
}
