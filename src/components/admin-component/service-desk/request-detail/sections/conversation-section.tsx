import { useState } from 'react';
import { SegmentedTabs } from '@/components/common-component/tabs';
import { Lock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { deskOf } from '@/lib/desk-config';
import { canCommentOnRequest, canSeeInternalNotes } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { cn, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { useAddRequestComment, useRequestComments } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest } from '@/types';
import { UserChip } from '@/components/employee-component/tasks/sections/task-badges';

export function ConversationSection({ request, user }: { request: AdminRequest; user: PermissionUser }) {
  const { data: comments = [], isLoading } = useRequestComments(request.id);
  const addComment = useAddRequestComment();
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const canInternal = canSeeInternalNotes(user, request);
  const canComment = canCommentOnRequest(user, request);

  const send = () => addComment.mutate({ id: request.id, body, internal: canInternal && internal }, { onSuccess: () => setBody('') });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          Conversation
        </h2>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No replies yet.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className={cn('rounded-lg border p-3', comment.internal ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white')}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <UserChip userId={comment.authorId} />
                  <span title={formatDateTime(comment.createdAt)}>{formatRelativeTime(comment.createdAt)}</span>
                  {comment.internal && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-900">
                      <Lock className="h-3 w-3" />
                      Internal note
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{comment.body}</p>
              </li>
            ))}
          </ul>
        )}

        {canComment ? (
          <div className="space-y-2">
            {canInternal && (
              <SegmentedTabs
                label="Reply type"
                tabs={[
                  { id: 'reply', label: 'Reply to requester' },
                  { id: 'internal', label: 'Internal note' },
                ]}
                value={internal ? 'internal' : 'reply'}
                onChange={(id) => setInternal(id === 'internal')}
              />
            )}
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              placeholder={internal ? `Only the ${deskOf(request.category).team} sees this` : canInternal ? 'The requester is notified' : 'Add details or ask a question'}
              aria-label={internal ? 'Internal note' : 'Reply'}
              className={cn(internal && 'border-amber-300 bg-amber-50/50')}
            />
            <div className="flex justify-end">
              <Button onClick={send} disabled={!body.trim() || addComment.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {addComment.isPending ? 'Sending…' : internal ? 'Add note' : 'Send'}
              </Button>
            </div>
          </div>
        ) : (
          request.status === 'closed' && <p className="text-sm text-gray-500">This request is closed. Raise a new one if you need more help.</p>
        )}
      </CardContent>
    </Card>
  );
}
