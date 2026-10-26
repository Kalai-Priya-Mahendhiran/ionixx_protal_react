import { AppDialog } from '@/components/ui/form-dialog';
import { getUserById } from '@/lib/user-directory';
import { formatDateTime } from '@/lib/utils';
import type { Asset } from '@/types';
import { HISTORY_LABELS } from './asset-log-meta';

export function AssetHistoryDialog({ asset, onOpenChange }: { asset: Asset | null; onOpenChange: (open: boolean) => void }) {
  return (
    <AppDialog open={!!asset} onOpenChange={onOpenChange} title={`${asset?.tag ?? 'Asset'} history`} description={asset?.model}>
      <ol className="space-y-3 text-sm">
        {[...(asset?.history ?? [])].reverse().map((entry) => (
          <li key={entry.id} className="border-l-2 border-gray-200 pl-3">
            <p className="font-medium text-gray-900">
              {HISTORY_LABELS[entry.action]}
              {entry.userId && (entry.action === 'issued' ? ' to ' : ' by ')}
              {entry.userId && (getUserById(entry.userId)?.name ?? 'Unknown')}
              {entry.requestKey && <span className="font-normal text-gray-500"> · {entry.requestKey}</span>}
            </p>
            {entry.note && <p className="text-gray-700">{entry.note}</p>}
            <p className="text-xs text-gray-500">
              {formatDateTime(entry.at)} · {getUserById(entry.actorId)?.name ?? 'Admin'}
            </p>
          </li>
        ))}
      </ol>
    </AppDialog>
  );
}
