import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ASSET_TYPE_LABELS } from '@/lib/desk-config';
import { getUserById } from '@/lib/user-directory';
import { useAssets, useIssueAsset, useReturnAsset } from '@/services/apis/service-desk/use-service-desk';
import type { AdminRequest } from '@/types';
import { selectClass } from './request-detail-meta';

export function AssetsSection({ request }: { request: AdminRequest }) {
  const personId = request.onBehalfOfId ?? request.requesterId;
  const { data: assets = [] } = useAssets();
  const issue = useIssueAsset();
  const giveBack = useReturnAsset();
  const [assetId, setAssetId] = useState('');
  const held = assets.filter((asset) => asset.status === 'issued' && asset.assignedToId === personId);
  const inStock = assets.filter((asset) => asset.status === 'in-stock');
  const name = getUserById(personId)?.name ?? 'them';

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">Assets · {name}</h2>
        {held.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing issued to {name}.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {held.map((asset) => (
              <li key={asset.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-gray-900">{asset.model}</span>
                  <span className="text-xs text-gray-500">
                    {ASSET_TYPE_LABELS[asset.type]} · {asset.tag}
                  </span>
                </span>
                <Button variant="outline" size="sm" disabled={giveBack.isPending} onClick={() => giveBack.mutate({ id: asset.id, requestKey: request.key })}>
                  Mark returned
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 border-t border-gray-100 pt-3">
          <select value={assetId} onChange={(event) => setAssetId(event.target.value)} aria-label="Asset to issue" className={selectClass}>
            <option value="">Issue from stock…</option>
            {inStock.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.tag} · {asset.model}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!assetId || issue.isPending}
            onClick={() => issue.mutate({ id: assetId, userId: personId, requestKey: request.key }, { onSuccess: () => setAssetId('') })}
            className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
          >
            Issue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
