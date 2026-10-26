import { Card, CardContent } from '@/components/ui/card';
import type { AdminRequest } from '@/types';
import { AttachmentList } from '@/components/employee-component/tasks/sections/task-attachments-field';

export function DetailsSection({ request }: { request: AdminRequest }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <p className="whitespace-pre-wrap text-sm text-gray-800">{request.description || 'No details given.'}</p>
        <AttachmentList attachments={request.attachments} />
      </CardContent>
    </Card>
  );
}
