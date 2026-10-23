import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, Lock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { RequiredLabel, SelectField, fieldClass, type Option } from '@/components/ui/form-fields';
import { TASK_ISSUE_TYPES, projectSchema, type ProjectFormValues } from '@/lib/schemas';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useCreateProject, useProjects, useReviewProjectAccess, useUpdateProject } from '@/services/apis/tasks/use-tasks';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { canManageProjectMembers } from '@/lib/permissions/task-permissions';
import type { Project, Task } from '@/types';
import { TASK_TYPE_CONFIG } from './task-config';
import { suggestProjectKey } from './task-utils';

const TYPE_OPTIONS: Option[] = TASK_ISSUE_TYPES.filter((type) => type !== 'sub-task').map((value) => ({ value, label: TASK_TYPE_CONFIG[value].label }));

interface ProjectDialogProps {
  open: boolean;
  // Editing when set
  project?: Project;
  tasks: Task[];
  existingKeys: string[];
  onOpenChange: (open: boolean) => void;
}

export function ProjectDialog({ open, project, tasks, existingKeys, onOpenChange }: ProjectDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isSaving = createProject.isPending || updateProject.isPending;
  const [keyTouched, setKeyTouched] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const reviewAccess = useReviewProjectAccess();
  const { user } = useAuth();
  // Who is on a project (members, membership controls, access requests) is decided by System Admin only
  const canEditMembers = canManageProjectMembers(user);
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });
  const [name, leadId, memberIds = [], openMembership = false] = useWatch({ control: form.control, name: ['name', 'leadId', 'memberIds', 'openMembership'] });
  // Requests come from the live list, so approving one updates the list without resetting the form
  const { data: liveProjects = [] } = useProjects();
  const pendingIds = liveProjects.find((item) => item.id === project?.id)?.pendingMemberIds ?? project?.pendingMemberIds ?? [];

  useEffect(() => {
    if (!open) return;
    setKeyTouched(!!project);
    setMemberSearch('');
    form.reset(
      project
        ? {
            name: project.name,
            key: project.key,
            description: project.description ?? '',
            leadId: project.leadId,
            defaultIssueType: project.defaultIssueType,
            memberIds: project.memberIds,
            openMembership: !!project.openMembership,
          }
        : { name: '', key: '', description: '', leadId: '', defaultIssueType: 'task', memberIds: [], openMembership: false },
    );
  }, [open, project, form]);

  // Suggest a key from the name until the admin types their own
  useEffect(() => {
    if (!project && !keyTouched) form.setValue('key', suggestProjectKey(name ?? ''));
  }, [name, keyTouched, project, form]);

  const toggleMember = (id: string) =>
    canEditMembers &&
    form.setValue('memberIds', memberIds.includes(id) ? memberIds.filter((item) => item !== id) : [...memberIds, id], { shouldDirty: true });

  // Active people, plus any current members who have since been deactivated so they can be removed
  const pickable = [...getActiveUsers(), ...memberIds.filter((id) => !getActiveUsers().some((member) => member.id === id)).map((id) => getUserById(id)).filter((member) => !!member)];
  const visibleMembers = pickable.filter((member) => member.name.toLowerCase().includes(memberSearch.toLowerCase()));
  const leadOptions: Option[] = getActiveUsers().map((member) => ({ value: member.id, label: member.name, hint: member.designation }));

  // People being removed who still have open work in this project
  const removedWithWork = useMemo(() => {
    if (!project) return [];
    return project.memberIds
      .filter((id) => !memberIds.includes(id) && id !== leadId)
      .map((id) => ({ id, open: tasks.filter((task) => task.projectId === project.id && task.assigneeId === id && task.status !== 'done').length }))
      .filter((entry) => entry.open > 0);
  }, [project, memberIds, leadId, tasks]);

  const onSubmit = (values: ProjectFormValues) => {
    if (!project && existingKeys.includes(values.key)) {
      form.setError('key', { message: `${values.key} is already used` });
      return;
    }
    const input = {
      name: values.name,
      description: values.description,
      leadId: values.leadId,
      defaultIssueType: values.defaultIssueType,
      memberIds: values.memberIds,
      // Only sent by System Admins, so editing other details never touches membership
      ...(canEditMembers ? { openMembership: values.openMembership } : {}),
    };
    const close = { onSuccess: () => onOpenChange(false) };
    if (project) updateProject.mutate({ id: project.id, input }, close);
    else createProject.mutate({ ...input, key: values.key }, close);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={project ? `Edit ${project.name}` : 'New project'}
      description={`The key starts every task number in this project, e.g. ${form.watch('key') || 'KEY'}-1.`}
      size="2xl"
      submitLabel={project ? 'Save project' : 'Create project'}
      pending={isSaving}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <RequiredLabel>Project name</RequiredLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Mobile App" className={fieldClass} autoFocus />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>Key</RequiredLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    disabled={!!project}
                    maxLength={10}
                    onChange={(event) => {
                      setKeyTouched(true);
                      field.onChange(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    }}
                    className={cn(fieldClass, 'font-mono uppercase')}
                  />
                  {project && <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />}
                </div>
              </FormControl>
              {project && <p className="text-xs text-gray-500">Keys can't change once tasks use them.</p>}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Description</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} placeholder="What this project is for" className={fieldClass} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField control={form.control} name="leadId" label="Project lead" options={leadOptions} placeholder="Choose the lead" />
        <SelectField control={form.control} name="defaultIssueType" label="Default task type" options={TYPE_OPTIONS} />
      </div>

      <section className="space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Members ({new Set([leadId, ...memberIds].filter(Boolean)).size})</h3>
            <p className="text-xs text-gray-500">
              Members can open every task of the project (including shared links) and plan its sprints. The lead is always a member.
            </p>
            {!canEditMembers && (
              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                <Lock className="h-3 w-3" />
                Only a System Admin can add or remove members.
              </p>
            )}
          </div>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Find people" aria-label="Find people" className="h-8 pl-8 text-sm" />
          </div>
        </div>
        <ul className="app-scrollbar grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-1.5 sm:grid-cols-2">
          {visibleMembers.map((member) => {
            const isLead = member.id === leadId;
            const checked = isLead || memberIds.includes(member.id);
            return (
              <li key={member.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  disabled={isLead || !canEditMembers}
                  onClick={() => toggleMember(member.id)}
                  className={cn('flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-indigo-50 disabled:cursor-default', checked && 'bg-indigo-50/60')}
                >
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border-2', checked ? 'border-[#464EB8] bg-[#464EB8] text-white' : 'border-gray-300 bg-white')}>
                    {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700">
                    {getInitials(member.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-gray-900">{member.name}</span>
                    <span className="block truncate text-xs text-gray-500">{isLead ? 'Project lead' : member.designation}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {removedWithWork.length > 0 && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {removedWithWork.map((entry) => `${getUserById(entry.id)?.name} (${entry.open} open)`).join(', ')} still{' '}
              {removedWithWork.length === 1 ? 'has' : 'have'} open tasks here. They keep them; reassign from the task list if needed.
            </span>
          </p>
        )}
      </section>

      {/* Membership controls, as in Atlassian teams: open projects can be joined by anyone, closed ones need approval */}
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Membership controls</h3>
        <label className={cn('flex items-start gap-2.5 text-sm text-gray-700', canEditMembers ? 'cursor-pointer' : 'cursor-not-allowed opacity-70')}>
          <input
            type="checkbox"
            checked={openMembership}
            disabled={!canEditMembers}
            onChange={(event) => form.setValue('openMembership', event.target.checked, { shouldDirty: true })}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#464EB8]"
          />
          <span>
            Anyone can join this project without approval
            <span className="block text-xs text-gray-500">
              {openMembership
                ? 'People who open a link to this project can join it themselves.'
                : 'People without access can request to join; a System Admin approves each request.'}
            </span>
          </span>
        </label>
      </section>

      {project && pendingIds.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Access requests ({pendingIds.length})</h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {pendingIds.map((id) => {
              const person = getUserById(id);
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-800">
                    {getInitials(person?.name ?? '?')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-gray-900">{person?.name ?? 'Unknown user'}</span>
                    <span className="block truncate text-xs text-gray-500">{person?.designation}</span>
                  </span>
                  {canEditMembers ? (
                    <span className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={reviewAccess.isPending}
                        onClick={() => reviewAccess.mutate({ project, userId: id, approve: false })}
                      >
                        Decline
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={reviewAccess.isPending}
                        onClick={() =>
                          reviewAccess.mutate(
                            { project, userId: id, approve: true },
                            // Keep the form's member list in step with the approval
                            { onSuccess: () => form.setValue('memberIds', [...new Set([...form.getValues('memberIds'), id])]) },
                          )
                        }
                        className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
                      >
                        Approve
                      </Button>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Waiting for a System Admin</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </FormDialog>
  );
}
