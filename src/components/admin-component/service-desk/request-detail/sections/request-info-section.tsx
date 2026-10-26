import { Card, CardContent } from '@/components/ui/card';
import { DESKS, REQUEST_CATEGORY_LABELS, deskOf } from '@/lib/desk-config';
import { getDeskTeam } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { getPriorityLabel } from '@/lib/workflow';
import { useAssignRequest, useUpdateRequest } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest, TaskPriority } from '@/types';
import { UserChip } from '@/components/employee-component/tasks/sections/task-badges';
import { CategoryChip } from '@/components/admin-component/service-desk/sections/desk-badges';
import { Row } from './detail-row';
import { PRIORITIES, SOURCE_LABELS, selectClass } from './request-detail-meta';

interface RequestInfoSectionProps {
  request: AdminRequest;
  user: PermissionUser;
  // Desk staff can recategorise, reprioritise and reassign
  isDesk: boolean;
  open: boolean;
}

export function RequestInfoSection({ request, user, isDesk, open }: RequestInfoSectionProps) {
  const assign = useAssignRequest();
  const update = useUpdateRequest();

  return (
    <Card>
      <CardContent className="divide-y divide-gray-100 p-5">
        <Row label="Category">
          {isDesk && open ? (
            <select value={request.category} onChange={(event) => update.mutate({ id: request.id, changes: { category: event.target.value as AdminRequest['category'] } })} aria-label="Category" className={selectClass}>
              {/* Picking another team's category passes the request on to that team */}
              {DESKS.map((desk) => (
                <optgroup key={desk.id} label={desk.team}>
                  {desk.categories.map((value) => (
                    <option key={value} value={value}>
                      {REQUEST_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          ) : (
            <CategoryChip category={request.category} />
          )}
        </Row>
        <Row label="Priority">
          {isDesk && open ? (
            <select value={request.priority} onChange={(event) => update.mutate({ id: request.id, changes: { priority: event.target.value as TaskPriority } })} aria-label="Priority" className={selectClass}>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {getPriorityLabel(value)}
                </option>
              ))}
            </select>
          ) : (
            getPriorityLabel(request.priority)
          )}
        </Row>
        <Row label="Assignee">
          {isDesk && request.status !== 'closed' ? (
            <select value={request.assigneeId ?? ''} onChange={(event) => assign.mutate({ id: request.id, assigneeId: event.target.value || undefined })} aria-label="Assignee" className={selectClass}>
              <option value="">Unassigned</option>
              {getDeskTeam(deskOf(request.category).id).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.id === user.id ? `${member.name} (me)` : member.name}
                </option>
              ))}
            </select>
          ) : request.assigneeId ? (
            <UserChip userId={request.assigneeId} />
          ) : (
            <span className="text-gray-500">Not picked up yet</span>
          )}
        </Row>
        <Row label="Requester">
          <UserChip userId={request.requesterId} />
        </Row>
        {request.onBehalfOfId && (
          <Row label="For">
            <UserChip userId={request.onBehalfOfId} />
          </Row>
        )}
        <Row label="Raised">
          <span title={formatDateTime(request.createdAt)}>{formatRelativeTime(request.createdAt)}</span>
        </Row>
        <Row label="Source">
          <span className="text-sm text-gray-700">{SOURCE_LABELS[request.source]}</span>
        </Row>
      </CardContent>
    </Card>
  );
}
