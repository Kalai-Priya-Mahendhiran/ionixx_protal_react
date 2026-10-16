import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, ListChecks, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormDialog } from '@/components/ui/form-dialog';
import { TextareaField } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { SEND_BACK_MIN_LENGTH, sendBackSchema, type SendBackFormValues } from '@/lib/form-schemas/tasks';
import { canApprove } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';
import { useApproveTask, useSendBackTask } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { DueDateChip, PriorityIndicator, TaskTypeIcon, UserChip } from './task-badges';
import { OnLeaveChip } from './leave-warning';
import { taskPath } from './task-link';
import { daysSince, type SubtaskProgress } from './task-utils';

function SendBackDialog({ task, onOpenChange }: { task: Task | null; onOpenChange: (open: boolean) => void }) {
  const sendBack = useSendBackTask();
  const form = useForm<SendBackFormValues>({ resolver: zodResolver(sendBackSchema), defaultValues: { reason: '' } });

  useEffect(() => {
    if (task) form.reset({ reason: '' });
  }, [task, form]);

  const submit = ({ reason }: SendBackFormValues) => {
    if (!task) return;
    sendBack.mutate({ task, reason }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <FormDialog
      open={!!task}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={submit}
      title={`Send ${task?.key ?? 'task'} back`}
      description={<>It moves back to In Progress. Your comment is posted on the task and sent to {task ? <UserChip userId={task.assigneeId} /> : 'the assignee'}.</>}
      submitLabel="Send back"
      pendingLabel="Sending…"
      pending={sendBack.isPending}
    >
      <TextareaField
        control={form.control}
        name="reason"
        label="What needs to change?"
        required
        rows={4}
        maxLength={1000}
        placeholder="e.g. The holiday legend overlaps the calendar on small screens"
        hint={`At least ${SEND_BACK_MIN_LENGTH} characters.`}
      />
    </FormDialog>
  );
}

interface ApprovalsSectionProps {
  tasks: Task[];
  subtaskProgress: Map<string, SubtaskProgress>;
}

export function ApprovalsSection({ tasks, subtaskProgress }: ApprovalsSectionProps) {
  const { user } = useAuth();
  const location = useLocation();
  const approve = useApproveTask();
  const [sendBackTask, setSendBackTask] = useState<Task | null>(null);

  // Oldest request first, so nothing waits forever
  const waiting = tasks.filter((task) => !task.parentId && canApprove(user, task)).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

  if (waiting.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h2 className="mb-2 text-lg font-medium text-gray-900">Nothing waiting for your approval</h2>
          <p className="text-gray-600">When someone on your team moves a task to In Review, it shows up here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {waiting.length} {waiting.length === 1 ? 'task is' : 'tasks are'} waiting for your review. Approve to move them to Done, or send them back with a comment.
      </p>
      {waiting.map((task) => {
        const waitingDays = daysSince(task.updatedAt);
        const progress = subtaskProgress.get(task.id);
        const isApproving = approve.isPending && approve.variables?.id === task.id;
        return (
          <Card key={task.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <TaskTypeIcon type={task.type} />
                  <Link to={taskPath(task.key)} state={{ from: location.search }} className="font-semibold text-[#464EB8] hover:underline">
                    {task.key}
                  </Link>
                  <Link to={taskPath(task.key)} state={{ from: location.search }} className="font-semibold text-gray-900 hover:underline">
                    {task.title}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                  <UserChip userId={task.assigneeId} label="By" />
                  <PriorityIndicator priority={task.priority} />
                  <DueDateChip task={task} />
                  <OnLeaveChip userId={task.assigneeId} date={task.dueDate} hidden={task.status === 'done'} />
                  <span className={cn('inline-flex items-center gap-1', waitingDays >= 2 ? 'font-medium text-amber-700' : 'text-gray-500')}>
                    <Clock className="h-4 w-4" />
                    {waitingDays === 0 ? 'In review · updated today' : `In review · updated ${waitingDays}d ago`}
                  </span>
                  {progress && progress.total > 0 && (
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <ListChecks className="h-4 w-4" />
                      {progress.done}/{progress.total} sub-tasks done
                    </span>
                  )}
                  {task.estimateHours !== undefined && (
                    <span className="text-gray-500">
                      {task.loggedHours}h / {task.estimateHours}h logged
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => setSendBackTask(task)} className="gap-1.5 text-amber-700 hover:bg-amber-50">
                  <Undo2 className="h-4 w-4" />
                  Send back
                </Button>
                <Button onClick={() => approve.mutate(task)} disabled={isApproving} className="gap-1.5 bg-green-600 text-white hover:bg-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {isApproving ? 'Approving…' : 'Approve'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      <SendBackDialog task={sendBackTask} onOpenChange={(open) => !open && setSendBackTask(null)} />
    </div>
  );
}
