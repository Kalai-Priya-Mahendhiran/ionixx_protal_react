import { Eye } from 'lucide-react';
import { getUserById } from '@/lib/user-directory';
import type { Project } from '@/types';
import { UserChip } from '@/components/employee-component/tasks/sections/task-badges';

export function ProjectHeaderSection({ project }: { project: Project }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-700">{project.key}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          <Eye className="h-3.5 w-3.5" />
          Read only
        </span>
      </div>
      {project.description && <p className="max-w-3xl text-gray-600">{project.description}</p>}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
        <span className="inline-flex items-center gap-2">
          Lead {getUserById(project.leadId) ? <UserChip userId={project.leadId} /> : <span className="text-gray-500">—</span>}
        </span>
        <span>
          {project.memberIds.length} {project.memberIds.length === 1 ? 'member' : 'members'}
        </span>
      </div>
    </div>
  );
}
