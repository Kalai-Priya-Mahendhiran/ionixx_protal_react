import { History, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ASSET_STATUS_LABELS, ASSET_TYPE_LABELS } from '@/lib/desk-config';
import { getUserById } from '@/lib/user-directory';
import { cn, formatDate } from '@/lib/utils';
import type { Asset } from '@/types';
import { STATUS_STYLE } from './asset-log-meta';

interface AssetTableSectionProps {
  assets: Asset[];
  onIssue: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
  // Sends an in-stock asset for repair, or puts a repaired one back in stock
  onToggleRepair: (asset: Asset) => void;
  onRetire: (asset: Asset) => void;
  onShowHistory: (asset: Asset) => void;
}

export function AssetTableSection({ assets, onIssue, onReturn, onToggleRepair, onRetire, onShowHistory }: AssetTableSectionProps) {
  return (
    <div className="app-scrollbar relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-600">
          <tr>
            <th className="px-3 py-2">Tag</th>
            <th className="px-3 py-2">Asset</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Issued to</th>
            <th className="w-12 px-3 py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-indigo-50/40">
              <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold text-gray-700">{asset.tag}</td>
              <td className="px-3 py-2.5">
                <p className="font-medium text-gray-900">{asset.model}</p>
                <p className="text-xs text-gray-500">
                  {ASSET_TYPE_LABELS[asset.type]}
                  {asset.serialNumber && ` · S/N ${asset.serialNumber}`}
                </p>
              </td>
              <td className="px-3 py-2.5">
                <span className={cn('rounded px-2 py-0.5 text-xs font-semibold', STATUS_STYLE[asset.status])}>{ASSET_STATUS_LABELS[asset.status]}</span>
              </td>
              <td className="px-3 py-2.5 text-gray-800">
                {asset.assignedToId ? (
                  <>
                    {getUserById(asset.assignedToId)?.name ?? 'Unknown'}
                    {asset.issuedAt && <p className="text-xs text-gray-500">since {formatDate(asset.issuedAt)}</p>}
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={`Actions for ${asset.tag}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    {asset.status === 'in-stock' && <DropdownMenuItem onSelect={() => onIssue(asset)}>Issue to someone…</DropdownMenuItem>}
                    {asset.status === 'issued' && <DropdownMenuItem onSelect={() => onReturn(asset)}>Record as returned</DropdownMenuItem>}
                    {(asset.status === 'in-stock' || asset.status === 'in-repair') && (
                      <DropdownMenuItem onSelect={() => onToggleRepair(asset)}>
                        {asset.status === 'in-repair' ? 'Back in stock' : 'Send for repair'}
                      </DropdownMenuItem>
                    )}
                    {(asset.status === 'in-stock' || asset.status === 'in-repair') && (
                      <DropdownMenuItem onSelect={() => onRetire(asset)} className="text-red-600">
                        Retire
                      </DropdownMenuItem>
                    )}
                    {asset.status !== 'retired' && <DropdownMenuSeparator />}
                    <DropdownMenuItem onSelect={() => onShowHistory(asset)}>
                      <History className="text-gray-500" />
                      History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
