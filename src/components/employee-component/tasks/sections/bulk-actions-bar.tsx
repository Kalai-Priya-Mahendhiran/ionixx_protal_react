import { ArrowRightLeft, ChevronDown, FolderInput, UserRoundPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { can, canManageProjects, getAssignableUsers } from '@/lib/permissions/task-permissions';
import { TASK_WORKFLOW_STATUSES } from '@/lib/schemas';
import type { BulkChange, BulkResult } from '@/services/apis/tasks/task-service';
import { useBulkUpdate } from '@/services/apis/tasks/use-tasks';
import type { Project, Task } from '@/types';
import { TASK_STATUS_CONFIG } from './task-config';

const MAX_SKIPPED_IN_TOAST = 3;

// "8 updated · 2 skipped" with the reasons for the skipped ones
function reportResult(result: BulkResult, action: string) {
  const { updated, skipped } = result;
  if (updated.length > 0) toast.success(`${updated.length} ${updated.length === 1 ? 'task' : 'tasks'} ${action}`);
  if (skipped.length > 0) {
    const shown = skipped.slice(0, MAX_SKIPPED_IN_TOAST).map((item) => `${item.key}: ${item.reason}`);
    if (skipped.length > MAX_SKIPPED_IN_TOAST) shown.push(`+${skipped.length - MAX_SKIPPED_IN_TOAST} more`);
    toast.warning(`${skipped.length} skipped`, { description: shown.join(' · '), duration: 8000 });
  }
  if (updated.length === 0 && skipped.length === 0) toast.info('Nothing to change');
}

interface BulkActionsBarProps {
  selected: Task[];
  projects: Project[];
  onDone: (result: BulkResult) => void;
  onClear: () => void;
}

export function BulkActionsBar({ selected, projects, onDone, onClear }: BulkActionsBarProps) {
  const { user } = useAuth();
  const bulkUpdate = useBulkUpdate();
  const ids = selected.map((task) => task.id);

  const run = (change: BulkChange, action: string) =>
    bulkUpdate.mutate(
      { ids, change },
      {
        onSuccess: (result) => {
          reportResult(result, action);
          onDone(result);
        },
      },
    );

  const trigger = (icon: React.ReactNode, label: string) => (
    <Button variant="outline" size="sm" disabled={bulkUpdate.isPending} className="h-8 gap-1.5 bg-white">
      {icon}
      {label}
      <ChevronDown className="h-3.5 w-3.5 opacity-60" />
    </Button>
  );

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[#464EB8]/30 bg-indigo-50 px-4 py-2.5 shadow-sm"
    >
      <span className="text-sm font-semibold text-indigo-900">
        {selected.length} selected
      </span>
      <span className="mx-1 h-5 w-px bg-indigo-200" aria-hidden />

      {can(user, 'task.assign') && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>{trigger(<UserRoundPlus className="h-4 w-4" />, 'Assign to')}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="ionixx-scrollbar max-h-72 w-60 overflow-y-auto bg-white">
            <DropdownMenuLabel className="text-xs text-gray-500">Assign {selected.length} to</DropdownMenuLabel>
            {getAssignableUsers(user).map((member) => (
              <DropdownMenuItem key={member.id} onSelect={() => run({ kind: 'assign', assigneeId: member.id }, `assigned to ${member.name}`)}>
                <span className="truncate">{member.id === user?.id ? `${member.name} (me)` : member.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {can(user, 'task.changeStatus') && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>{trigger(<ArrowRightLeft className="h-4 w-4" />, 'Change status')}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white">
            {TASK_WORKFLOW_STATUSES.map((status) => (
              <DropdownMenuItem key={status} onSelect={() => run({ kind: 'status', status }, `moved to ${TASK_STATUS_CONFIG[status].label}`)}>
                {TASK_STATUS_CONFIG[status].label}
                {status === 'done' && <span className="ml-auto text-xs text-gray-400">Close</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {canManageProjects(user) && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>{trigger(<FolderInput className="h-4 w-4" />, 'Move to project')}</DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60 bg-white">
            <DropdownMenuLabel className="text-xs text-gray-500">Tasks get new keys in the target project</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => run({ kind: 'project', projectId: project.id }, `moved to ${project.name}`)}>
                <span className="rounded bg-indigo-100 px-1.5 text-[10px] font-bold text-indigo-700">{project.key}</span>
                {project.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto h-8 gap-1 text-indigo-900">
        <X className="h-4 w-4" />
        Clear selection
      </Button>
    </div>
  );
}
