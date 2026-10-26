import { Card, CardContent } from '@/components/ui/card';
import { getUserById } from '@/lib/user-directory';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import type { RequestActivity } from '@/types';

export function HistorySection({ activity }: { activity: RequestActivity[] }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">History</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">No changes yet.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {activity.map((entry) => (
              <li key={entry.id} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-medium text-gray-900">{entry.actorId === 'system' ? 'Automation' : (getUserById(entry.actorId)?.name ?? 'Someone')}</span>{' '}
                  <span className="text-gray-700">{entry.summary.charAt(0).toLowerCase() + entry.summary.slice(1)}</span>
                  <span className="block text-xs text-gray-500" title={formatDateTime(entry.createdAt)}>
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
