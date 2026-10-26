import { Link, useLocation } from 'react-router-dom';
import { Hourglass, Lock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { useJoinProject, useRequestProjectAccess } from '@/services/apis/tasks/use-tasks';
import type { Project } from '@/types';

// A shared link to a project the person isn't on: open projects can be joined, closed ones take a request
export function ProjectAccessSection({ project, user, backTo }: { project: Project; user: PermissionUser; backTo: string }) {
  const location = useLocation();
  const joinProject = useJoinProject();
  const requestAccess = useRequestProjectAccess();
  const pending = (project.pendingMemberIds ?? []).includes(user.id);

  return (
    <Card>
      <CardContent className="mx-auto max-w-lg p-12 text-center">
        <Lock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <h1 className="mb-2 text-lg font-medium text-gray-900">You don't have access to {project.name}</h1>
        <p className="mb-5 text-gray-600">
          {project.openMembership
            ? 'Anyone can join this project. Join it to open this task and the rest of its work.'
            : pending
              ? 'Your request to join is waiting for a System Admin. You will be notified when it is reviewed.'
              : 'This link is for members of the project. Ask to join and a System Admin will review your request.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link to={backTo}>Back to tasks</Link>
          </Button>
          {project.openMembership ? (
            <Button onClick={() => joinProject.mutate(project)} disabled={joinProject.isPending} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              <UserPlus className="h-4 w-4" />
              {joinProject.isPending ? 'Joining…' : 'Join project'}
            </Button>
          ) : pending ? (
            <Button disabled variant="outline" className="gap-2">
              <Hourglass className="h-4 w-4" />
              Request pending
            </Button>
          ) : (
            <Button
              onClick={() => requestAccess.mutate({ project, link: location.pathname })}
              disabled={requestAccess.isPending}
              className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
            >
              <UserPlus className="h-4 w-4" />
              {requestAccess.isPending ? 'Sending…' : 'Request access'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
