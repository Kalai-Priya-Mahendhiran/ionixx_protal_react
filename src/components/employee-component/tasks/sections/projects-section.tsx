import { useState } from 'react';
import { FolderKanban, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getUserById } from '@/lib/user-directory';
import { getInitials } from '@/lib/utils';
import type { Project, Task } from '@/types';
import { ProjectDialog } from './project-dialog';
import { TaskTypeGlyph, UserChip } from './task-badges';

const MAX_AVATARS = 5;

interface ProjectsSectionProps {
  projects: Project[];
  // Every visible task, for per-project counts
  tasks: Task[];
}

export function ProjectsSection({ projects, tasks }: ProjectsSectionProps) {
  const [dialog, setDialog] = useState<{ open: boolean; project?: Project }>({ open: false });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Each project's key starts its task numbers (IXP-101, HR-12). Members can be planned into its sprints.</p>
        <Button onClick={() => setDialog({ open: true })} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderKanban className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-lg font-medium text-gray-900">No projects yet</h2>
            <p className="text-gray-600">Create the first one to start numbering tasks.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="app-scrollbar relative overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">
                <tr>
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Lead</th>
                  <th className="px-4 py-2.5">Members</th>
                  <th className="px-4 py-2.5 text-right">Open</th>
                  <th className="px-4 py-2.5 text-right">Done</th>
                  <th className="px-4 py-2.5">Default type</th>
                  <th className="w-20 px-4 py-2.5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((project) => {
                  const projectTasks = tasks.filter((task) => task.projectId === project.id && !task.parentId);
                  const open = projectTasks.filter((task) => task.status !== 'done').length;
                  const done = projectTasks.length - open;
                  return (
                    <tr key={project.id} className="hover:bg-indigo-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-indigo-100 px-2 py-1 font-mono text-xs font-bold text-indigo-700">{project.key}</span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{project.name}</p>
                            {project.description && <p className="truncate text-xs text-gray-500">{project.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <UserChip userId={project.leadId} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          {project.memberIds.slice(0, MAX_AVATARS).map((id) => (
                            <span
                              key={id}
                              title={getUserById(id)?.name}
                              className="-ml-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 ring-2 ring-white first:ml-0"
                            >
                              {getInitials(getUserById(id)?.name ?? '?')}
                            </span>
                          ))}
                          {project.memberIds.length > MAX_AVATARS && (
                            <span className="ml-1.5 text-xs text-gray-500">+{project.memberIds.length - MAX_AVATARS}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{open}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{done}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-700">
                          <TaskTypeGlyph type={project.defaultIssueType} />
                          {project.defaultIssueType === 'hr' ? 'HR' : project.defaultIssueType.charAt(0).toUpperCase() + project.defaultIssueType.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDialog({ open: true, project })} className="gap-1.5">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProjectDialog
        open={dialog.open}
        project={dialog.project}
        tasks={tasks}
        existingKeys={projects.map((project) => project.key)}
        onOpenChange={(open) => !open && setDialog((current) => ({ ...current, open: false }))}
      />
    </div>
  );
}
