import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, Lock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass, type Option } from '@/components/ui/form-fields';
import { TASK_ISSUE_TYPES, projectSchema, type ProjectFormValues } from '@/lib/schemas';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, getInitials } from '@/lib/utils';
import { useCreateProject, useUpdateProject } from '@/services/apis/tasks/use-tasks';
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
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema) });
  const [name, leadId, memberIds = []] = useWatch({ control: form.control, name: ['name', 'leadId', 'memberIds'] });

  useEffect(() => {
    if (!open) return;
    setKeyTouched(!!project);
    setMemberSearch('');
    form.reset(
      project
        ? { name: project.name, key: project.key, description: project.description ?? '', leadId: project.leadId, defaultIssueType: project.defaultIssueType, memberIds: project.memberIds }
        : { name: '', key: '', description: '', leadId: '', defaultIssueType: 'task', memberIds: [] },
    );
  }, [open, project, form]);

  // Suggest a key from the name until the admin types their own
  useEffect(() => {
    if (!project && !keyTouched) form.setValue('key', suggestProjectKey(name ?? ''));
  }, [name, keyTouched, project, form]);

  const toggleMember = (id: string) =>
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
    const input = { name: values.name, description: values.description, leadId: values.leadId, defaultIssueType: values.defaultIssueType, memberIds: values.memberIds };
    const close = { onSuccess: () => onOpenChange(false) };
    if (project) updateProject.mutate({ id: project.id, input }, close);
    else createProject.mutate({ ...input, key: values.key }, close);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden bg-white p-0">
        <DialogHeader className="border-b border-indigo-100 px-6 py-4 pr-12">
          <DialogTitle className="text-xl">{project ? `Edit ${project.name}` : 'New project'}</DialogTitle>
          <DialogDescription>The key starts every task number in this project, e.g. {form.watch('key') || 'KEY'}-1.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col" noValidate>
            <div className="ionixx-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
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
                    <p className="text-xs text-gray-500">Members can be planned into this project's sprints. The lead is always a member.</p>
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                    <Input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Find people" aria-label="Find people" className="h-8 pl-8 text-sm" />
                  </div>
                </div>
                <ul className="ionixx-scrollbar grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-gray-200 p-1.5 sm:grid-cols-2">
                  {visibleMembers.map((member) => {
                    const isLead = member.id === leadId;
                    const checked = isLead || memberIds.includes(member.id);
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          disabled={isLead}
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
            </div>
            <div className="flex justify-end gap-2 border-t border-indigo-100 bg-gray-50/60 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {isSaving ? 'Saving…' : project ? 'Save project' : 'Create project'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
