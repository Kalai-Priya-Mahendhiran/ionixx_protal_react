import { useState, type FormEvent } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldClass } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { can, canCreateSubtask, canTransition, getAssignableUsers } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useChangeTaskStatus, useCreateSubtask } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { TaskStatusBadge } from './task-badges';
import { progressPercent } from './task-utils';

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

  const toggle = (subtask: Task) => {
    const next = subtask.status === 'done' ? 'todo' : 'done';
    if (canTransition(user, subtask, next)) changeStatus.mutate({ task: subtask, status: next });
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
            const canToggle = canTransition(user, subtask, isDone ? 'todo' : 'done');
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
                <button type="button" onClick={() => onOpen(subtask)} className="min-w-0 flex-1 text-left">
                  <span className="mr-2 text-xs font-semibold text-[#464EB8]">{subtask.key}</span>
                  <span className={cn('text-sm', isDone ? 'text-gray-400 line-through' : 'text-gray-800 hover:underline')}>{subtask.title}</span>
                </button>
                {!isDone && subtask.status !== 'todo' && <TaskStatusBadge status={subtask.status} />}
                <span
                  title={assignee?.name}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700"
                >
                  {getInitials(assignee?.name ?? '?')}
                </span>
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
    </section>
  );
}
