import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CalendarOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { RequiredLabel, SelectField, fieldClass, type Option } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { applyTemplateSchema, type ApplyTemplateFormValues } from '@/lib/schemas';
import { TEMPLATE_ANCHOR_LABELS, formatOffset, planChecklist } from '@/lib/task-templates';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, toDateInput, todayAsDateInput } from '@/lib/utils';
import { findAbsence, useAbsences } from '@/services/apis/leave/use-leave';
import { useApplyTemplate } from '@/services/apis/tasks/use-tasks';
import type { Task, TaskTemplate } from '@/types';
import { PriorityIndicator } from './task-badges';
import { formatShortDate } from './task-utils';

const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInput(date);
};

// Onboarding starts on a future joining date; offboarding defaults to a last day two weeks out
function defaultAnchor(template: TaskTemplate, subjectId: string): string {
  if (template.kind === 'onboarding') {
    const joining = getUserById(subjectId)?.joiningDate;
    return joining && joining >= todayAsDateInput() ? joining : todayAsDateInput();
  }
  return template.kind === 'offboarding' ? inDays(14) : todayAsDateInput();
}

interface ApplyTemplateDialogProps {
  template: TaskTemplate | null;
  onOpenChange: (open: boolean) => void;
  onApplied: (checklist: Task) => void;
}

export function ApplyTemplateDialog({ template, onOpenChange, onApplied }: ApplyTemplateDialogProps) {
  const { user } = useAuth();
  const applyTemplate = useApplyTemplate();
  const { data: absences = [] } = useAbsences();
  const form = useForm<ApplyTemplateFormValues>({ resolver: zodResolver(applyTemplateSchema) });
  const [subjectId, anchorDate] = useWatch({ control: form.control, name: ['subjectId', 'anchorDate'] });

  // New joiners first for onboarding: people whose joining date is still ahead
  const today = todayAsDateInput();
  const people = getActiveUsers().sort((a, b) => {
    if (template?.kind !== 'onboarding') return a.name.localeCompare(b.name);
    return Number((b.joiningDate ?? '') >= today) - Number((a.joiningDate ?? '') >= today) || a.name.localeCompare(b.name);
  });
  const subjectOptions: Option[] = people.map((member) => ({
    value: member.id,
    label: member.name,
    hint:
      template?.kind === 'onboarding' && member.joiningDate && member.joiningDate >= today
        ? `Joins ${formatShortDate(member.joiningDate)} · ${member.designation}`
        : member.designation,
  }));

  useEffect(() => {
    if (!template) return;
    const firstSubject = template.kind === 'onboarding' ? (people.find((member) => (member.joiningDate ?? '') >= today)?.id ?? '') : '';
    form.reset({ subjectId: firstSubject, anchorDate: firstSubject ? defaultAnchor(template, firstSubject) : defaultAnchor(template, '') });
    // Only when the dialog opens for a template
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, form]);

  const plan = template && user && subjectId && anchorDate ? planChecklist(template, subjectId, anchorDate, user) : null;
  const pastItems = plan?.items.filter((planned) => planned.dueDate < today).length ?? 0;

  const onSubmit = (values: ApplyTemplateFormValues) => {
    if (!template) return;
    applyTemplate.mutate(
      { template, subjectId: values.subjectId, anchorDate: values.anchorDate },
      {
        onSuccess: (checklist) => {
          onOpenChange(false);
          onApplied(checklist as Task);
        },
      },
    );
  };

  return (
    <FormDialog
      open={!!template}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={`Apply "${template?.name ?? ''}"`}
      description={`Creates one checklist task with ${template?.items.length ?? 0} sub-tasks, each assigned to its owner with a real due date.`}
      size="2xl"
      submitLabel={`Create checklist (${template?.items.length ?? 0} tasks)`}
      pendingLabel="Creating…"
      pending={applyTemplate.isPending}
      submitDisabled={!plan}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            control={form.control}
            name="subjectId"
            label="Employee"
            options={subjectOptions}
            placeholder="Choose the employee"
            onValueChange={(id) => template && form.setValue('anchorDate', defaultAnchor(template, id), { shouldValidate: true })}
          />
          <FormField
            control={form.control}
            name="anchorDate"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>{template ? TEMPLATE_ANCHOR_LABELS[template.kind] : 'Date'}</RequiredLabel>
                <FormControl>
                  <Input {...field} type="date" className={fieldClass} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {plan ? (
          <section className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{plan.title}</h3>
              <span className="text-xs text-gray-500">
                {formatShortDate(plan.startDate)} – {formatShortDate(plan.dueDate)} · {plan.estimateHours}h estimated
              </span>
            </div>
            {pastItems > 0 && (
              <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {pastItems} {pastItems === 1 ? 'item is' : 'items are'} due before today and will show as overdue.
              </p>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Day</th>
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plan.items.map(({ item, assigneeId, dueDate }) => {
                    const onLeave = findAbsence(absences, assigneeId, dueDate);
                    return (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-gray-500">{formatOffset(item.offsetDays)}</td>
                        <td className="px-3 py-2">
                          <span className="block text-gray-900">{item.title}</span>
                          <PriorityIndicator priority={item.priority} />
                        </td>
                        <td className="px-3 py-2">
                          <span className="block text-gray-800">{item.owner === 'admin' ? 'Admin team' : (getUserById(assigneeId)?.name ?? 'Unknown')}</span>
                          {item.owner === 'admin' && <span className="block text-xs text-gray-500">Service desk request · you track it</span>}
                          {onLeave && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                              <CalendarOff className="h-3 w-3" />
                              On leave that day
                            </span>
                          )}
                        </td>
                        <td className={cn('whitespace-nowrap px-3 py-2', dueDate < today ? 'font-medium text-red-700' : 'text-gray-700')}>
                          {formatShortDate(dueDate)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            Choose the employee and date to preview the checklist.
          </p>
        )}
      </div>
    </FormDialog>
  );
}
