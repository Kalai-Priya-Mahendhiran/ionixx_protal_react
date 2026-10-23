import { useState } from 'react';
import { Plus, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { canManageSprints } from '@/lib/permissions/task-permissions';
import { cn } from '@/lib/utils';
import type { Project, Sprint } from '@/types';
import type { FilterOption } from './filter-options';
import { CreateSprintDialog } from './sprint-dialogs';
import type { AdvancedFilters } from './task-utils';

const STATUS_DOT: Record<string, string> = { active: 'bg-green-500', planned: 'bg-blue-400', completed: 'bg-gray-400' };

interface SprintMenuProps {
  filters: AdvancedFilters;
  // Sprints with visible work, plus the backlog (from getFilterOptions)
  options: FilterOption[];
  projects: Project[];
  sprints: Sprint[];
  onChange: (filters: AdvancedFilters) => void;
}

// The board's Sprint button, on every view: filter by sprint, and create one in any project you can plan
export function SprintMenu({ filters, options, projects, sprints, onChange }: SprintMenuProps) {
  const { user } = useAuth();
  const [createFor, setCreateFor] = useState<Project | null>(null);
  const selected = filters.sprintIds;
  const plannable = projects.filter((project) => canManageSprints(user, project));
  const activeIds = sprints.filter((sprint) => sprint.status === 'active' && options.some((option) => option.value === sprint.id)).map((sprint) => sprint.id);
  const onlyActive = activeIds.length > 0 && selected.length === activeIds.length && activeIds.every((id) => selected.includes(id));

  const toggle = (id: string) => onChange({ ...filters, sprintIds: selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id] });
  const label = selected.length === 0 ? 'Sprint' : onlyActive ? 'Active sprint' : selected.length === 1 ? (options.find((option) => option.value === selected[0])?.label ?? 'Sprint') : `${selected.length} sprints`;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn('h-9 max-w-[14rem] gap-1.5', selected.length > 0 && 'border-[#464EB8]/40 bg-indigo-50 text-[#464EB8]')}>
            <Rocket className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" collisionPadding={16} className="w-72 bg-white">
          <DropdownMenuLabel className="text-xs text-gray-500">Show work in</DropdownMenuLabel>
          {activeIds.length > 0 && (
            <DropdownMenuCheckboxItem checked={onlyActive} onCheckedChange={() => onChange({ ...filters, sprintIds: onlyActive ? [] : activeIds })} onSelect={(event) => event.preventDefault()}>
              <span className="font-medium">Active sprint{activeIds.length > 1 ? 's' : ''}</span>
            </DropdownMenuCheckboxItem>
          )}
          {options.map((option) => (
            <DropdownMenuCheckboxItem key={option.value} checked={selected.includes(option.value)} onCheckedChange={() => toggle(option.value)} onSelect={(event) => event.preventDefault()}>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {option.hint && <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[option.hint])} aria-hidden="true" />}
                <span className="truncate">{option.label}</span>
                {option.hint && <span className="ml-auto text-xs capitalize text-gray-400">{option.hint}</span>}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          {selected.length > 0 && (
            <DropdownMenuItem onSelect={() => onChange({ ...filters, sprintIds: [] })} className="text-[#464EB8]">
              Show all sprints
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {plannable.length > 0 ? (
            plannable.map((project) => (
              <DropdownMenuItem key={project.id} onSelect={() => setCreateFor(project)}>
                <Plus className="text-[#464EB8]" />
                {plannable.length === 1 ? 'Create sprint' : `Create sprint in ${project.name}`}
              </DropdownMenuItem>
            ))
          ) : (
            <p className="px-2 py-1.5 text-xs text-gray-500">Join a project to plan its sprints.</p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateSprintDialog project={createFor} sprints={sprints} onOpenChange={(open) => !open && setCreateFor(null)} />
    </>
  );
}
