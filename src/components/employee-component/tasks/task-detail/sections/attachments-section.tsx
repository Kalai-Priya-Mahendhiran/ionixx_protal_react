import { useAddAttachments, useRemoveAttachment } from '@/services/apis/tasks/use-tasks';
import type { Task } from '@/types';
import { AttachmentDropzone, AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';

export function AttachmentsSection({ task, canEdit }: { task: Task; canEdit: boolean }) {
  const addAttachments = useAddAttachments();
  const removeAttachment = useRemoveAttachment();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">
        Attachments {task.attachments.length > 0 && <span className="font-normal text-gray-500">({task.attachments.length})</span>}
      </h2>
      <AttachmentList
        attachments={task.attachments}
        onRemove={canEdit ? (attachment) => removeAttachment.mutate({ task, attachmentId: attachment.id }) : undefined}
      />
      {canEdit ? (
        <AttachmentDropzone compact taskId={task.id} onUploaded={(attachments) => addAttachments.mutate({ task, attachments })} />
      ) : (
        task.attachments.length === 0 && <p className="text-sm text-gray-400">No attachments.</p>
      )}
    </section>
  );
}
