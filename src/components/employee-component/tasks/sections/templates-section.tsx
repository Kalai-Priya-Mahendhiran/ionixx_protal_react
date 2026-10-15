import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, LogIn, LogOut, ListChecks, MoreHorizontal, Pencil, Play, Plus, Trash2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TEMPLATE_KIND_LABELS, TEMPLATE_OWNER_LABELS } from '@/lib/task-templates';
import { getUserById } from '@/lib/user-directory';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useDeleteTemplate, useTaskTemplates } from '@/services/apis/templates/use-templates';
import type { TaskTemplate, TemplateKind, TemplateOwner } from '@/types';
import { ApplyTemplateDialog } from './apply-template-dialog';
import { taskPath } from './task-link';
import { TemplateEditorDialog } from './template-editor-dialog';

const KIND_STYLE: Record<TemplateKind, { icon: LucideIcon; className: string }> = {
  onboarding: { icon: LogIn, className: 'bg-green-100 text-green-700' },
  offboarding: { icon: LogOut, className: 'bg-amber-100 text-amber-700' },
  custom: { icon: ListChecks, className: 'bg-indigo-100 text-indigo-700' },
};

type EditorState = { open: boolean; template?: TaskTemplate; initial?: TaskTemplate };

export function TemplatesSection() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading, isError, refetch } = useTaskTemplates();
  const deleteTemplate = useDeleteTemplate();
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [applying, setApplying] = useState<TaskTemplate | null>(null);
  const [deleting, setDeleting] = useState<TaskTemplate | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Reusable checklists. Apply one to create every task for an employee in one go.</p>
        <Button onClick={() => setEditor({ open: true })} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
          <Plus className="h-4 w-4" />
          New template
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
          ))}
        </div>
      )}
      {isError && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-3 text-gray-700">Couldn't load templates.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}
      {!isLoading && !isError && templates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ListChecks className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-lg font-medium text-gray-900">No templates yet</h2>
            <p className="text-gray-600">Create one for onboarding, offboarding or any repeatable HR process.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => {
          const { icon: Icon, className } = KIND_STYLE[template.kind];
          const owners = [...new Set(template.items.map((item) => item.owner))] as TemplateOwner[];
          const estimate = template.items.reduce((sum, item) => sum + (item.estimateHours ?? 0), 0);
          const offsets = template.items.map((item) => item.offsetDays);
          return (
            <Card key={template.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={cn('rounded-lg p-2', className)}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500">
                        {TEMPLATE_KIND_LABELS[template.kind]} · {template.items.length} items · {estimate}h · Day {Math.min(...offsets)} to Day {Math.max(...offsets)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`More actions for ${template.name}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white">
                      <DropdownMenuItem onSelect={() => setEditor({ open: true, template })}>
                        <Pencil className="text-gray-500" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setEditor({ open: true, initial: template })}>
                        <Copy className="text-gray-500" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => setDeleting(template)} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {template.description && <p className="text-sm text-gray-600">{template.description}</p>}
                <ol className="space-y-1 text-sm text-gray-700">
                  {template.items.slice(0, 4).map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />
                      <span className="truncate">{item.title}</span>
                    </li>
                  ))}
                  {template.items.length > 4 && <li className="pl-3.5 text-xs text-gray-500">+{template.items.length - 4} more</li>}
                </ol>
                <p className="text-xs text-gray-500">Owners: {owners.map((owner) => TEMPLATE_OWNER_LABELS[owner].replace(' (you)', '')).join(', ')}</p>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-400">
                    Updated {formatRelativeTime(template.updatedAt)} by {getUserById(template.updatedById)?.name ?? 'someone'}
                  </span>
                  <Button size="sm" onClick={() => setApplying(template)} className="gap-1.5 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                    <Play className="h-3.5 w-3.5" />
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <TemplateEditorDialog
        open={editor.open}
        template={editor.template}
        initial={editor.initial}
        onOpenChange={(open) => !open && setEditor((current) => ({ ...current, open: false }))}
      />
      <ApplyTemplateDialog template={applying} onOpenChange={(open) => !open && setApplying(null)} onApplied={(checklist) => navigate(taskPath(checklist.key))} />
      <ConfirmDialog
        open={!!deleting}
        title={`Delete "${deleting?.name}"?`}
        description="Checklists already created from this template keep their tasks. This can't be undone."
        confirmLabel="Delete template"
        destructive
        loading={deleteTemplate.isPending}
        onConfirm={() => deleting && deleteTemplate.mutate(deleting, { onSettled: () => setDeleting(null) })}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
