import { useState } from 'react';
import { Laptop, PackageCheck, Plus, UserCheck, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader, headerPrimaryButtonClass } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatCard, StatGrid } from '@/components/ui/stat-card';
import MainLayout from '@/components/layout/main-layout';
import { getUserById } from '@/lib/user-directory';
import { cn } from '@/lib/utils';
import { useAssets, useReturnAsset, useSetAssetStatus } from '@/services/apis/service-desk/use-service-desk';
import type { Asset, AssetStatus, AssetType } from '@/types';
import { AddAssetDialog, AssetFiltersSection, AssetHistoryDialog, AssetTableSection, IssueAssetDialog } from './sections';
import { ASSET_LOG_INFO } from './sections/asset-log-info';

export default function AssetLog() {
  const { data: assets = [], isLoading, isError, refetch } = useAssets();
  const giveBack = useReturnAsset();
  const setStatus = useSetAssetStatus();
  const [adding, setAdding] = useState(false);
  const [issuing, setIssuing] = useState<Asset | null>(null);
  const [historyOf, setHistoryOf] = useState<Asset | null>(null);
  const [retiring, setRetiring] = useState<Asset | null>(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<AssetType | ''>('');
  const [status, setStatusFilter] = useState<AssetStatus | ''>('');

  const count = (value: AssetStatus) => assets.filter((asset) => asset.status === value).length;
  const query = search.trim().toLowerCase();
  const shown = assets.filter(
    (asset) =>
      (!type || asset.type === type) &&
      (!status || asset.status === status) &&
      (!query || [asset.tag, asset.model, asset.serialNumber ?? '', getUserById(asset.assignedToId)?.name ?? ''].some((text) => text.toLowerCase().includes(query))),
  );

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          icon={Laptop}
          title="Asset Log"
          description="Which asset is issued to whom: laptops, monitors, headsets, ID and access cards"
          info={ASSET_LOG_INFO}
          actions={
            <Button onClick={() => setAdding(true)} className={cn('gap-2', headerPrimaryButtonClass)}>
              <Plus className="h-4 w-4" />
              Add asset
            </Button>
          }
        />

        <StatGrid>
          {(
            [
              ['', 'All assets', assets.length, Laptop, 'indigo'],
              ['issued', 'Issued', count('issued'), UserCheck, 'indigo'],
              ['in-stock', 'In stock', count('in-stock'), PackageCheck, 'green'],
              ['in-repair', 'In repair', count('in-repair'), Wrench, 'amber'],
            ] as const
          ).map(([value, label, total, icon, tone]) => (
            <StatCard key={label} icon={icon} label={label} value={total} tone={tone} loading={isLoading} active={status === value} onClick={() => setStatusFilter(value)} />
          ))}
        </StatGrid>

        <AssetFiltersSection search={search} onSearchChange={setSearch} type={type} onTypeChange={setType} status={status} onStatusChange={setStatusFilter} />

        {isLoading ? (
          <div className="h-72 animate-pulse rounded-xl bg-gray-100" aria-busy="true" aria-label="Loading assets" />
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load the asset log.{' '}
            <button type="button" onClick={() => refetch()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">No assets match these filters.</div>
        ) : (
          <AssetTableSection
            assets={shown}
            onIssue={setIssuing}
            onReturn={(asset) => giveBack.mutate({ id: asset.id })}
            onToggleRepair={(asset) => setStatus.mutate({ id: asset.id, status: asset.status === 'in-repair' ? 'in-stock' : 'in-repair' })}
            onRetire={setRetiring}
            onShowHistory={setHistoryOf}
          />
        )}
      </div>

      <AddAssetDialog open={adding} onOpenChange={setAdding} />
      <IssueAssetDialog asset={issuing} onOpenChange={(open) => !open && setIssuing(null)} />
      <AssetHistoryDialog asset={historyOf} onOpenChange={(open) => !open && setHistoryOf(null)} />
      <ConfirmDialog
        open={!!retiring}
        title={`Retire ${retiring?.tag ?? 'asset'}?`}
        description="Retired assets stay in the log for the record but can't be issued again."
        confirmLabel="Retire asset"
        destructive
        loading={setStatus.isPending}
        onConfirm={() => retiring && setStatus.mutate({ id: retiring.id, status: 'retired' }, { onSettled: () => setRetiring(null) })}
        onOpenChange={(open) => !open && setRetiring(null)}
      />
    </MainLayout>
  );
}
