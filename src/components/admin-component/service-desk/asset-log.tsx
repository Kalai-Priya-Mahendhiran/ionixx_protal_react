import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { History, MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { RequiredLabel, SelectField, fieldClass } from '@/components/ui/form-fields';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/main-layout';
import { ASSET_STATUS_LABELS, ASSET_TAG_PREFIX, ASSET_TYPES, ASSET_TYPE_LABELS } from '@/lib/desk-config';
import { ASSET_TYPE_VALUES, assetSchema, type AssetFormValues } from '@/lib/schemas';
import { getActiveUsers, getUserById } from '@/lib/user-directory';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useAssets, useCreateAsset, useIssueAsset, useReturnAsset, useSetAssetStatus } from '@/services/apis/service-desk/use-service-desk';
import type { Asset, AssetStatus, AssetType } from '@/types';

const STATUS_STYLE: Record<AssetStatus, string> = {
  'in-stock': 'bg-green-100 text-green-800',
  issued: 'bg-indigo-100 text-indigo-800',
  'in-repair': 'bg-amber-100 text-amber-900',
  retired: 'bg-gray-100 text-gray-600',
};

const HISTORY_LABELS: Record<Asset['history'][number]['action'], string> = {
  added: 'Added to the log',
  issued: 'Issued',
  returned: 'Returned',
  repair: 'Sent for repair',
  retired: 'Retired',
  updated: 'Updated',
};

function AddAssetDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateAsset();
  const form = useForm<AssetFormValues>({ resolver: zodResolver(assetSchema), defaultValues: { type: 'laptop', model: '', serialNumber: '', tag: '' } });
  const type = form.watch('type');
  useEffect(() => {
    if (open) form.reset({ type: 'laptop', model: '', serialNumber: '', tag: '' });
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Add an asset</DialogTitle>
          <DialogDescription>New assets start in stock, ready to issue.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => create.mutate(values, { onSuccess: () => onOpenChange(false) }))} className="space-y-4">
            <SelectField control={form.control} name="type" label="Type" options={ASSET_TYPE_VALUES.map((value) => ({ value, label: ASSET_TYPE_LABELS[value] }))} />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <RequiredLabel>Make and model</RequiredLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Dell Latitude 5440" className={fieldClass} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Serial number</FormLabel>
                    <FormControl>
                      <Input {...field} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Asset tag</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={`Auto, e.g. ${ASSET_TAG_PREFIX[type as AssetType]}-0012`} className={fieldClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
                {create.isPending ? 'Adding…' : 'Add asset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function IssueDialog({ asset, onOpenChange }: { asset: Asset | null; onOpenChange: (open: boolean) => void }) {
  const issue = useIssueAsset();
  const [userId, setUserId] = useState('');
  const [requestKey, setRequestKey] = useState('');
  useEffect(() => {
    setUserId('');
    setRequestKey('');
  }, [asset]);
  return (
    <Dialog open={!!asset} onOpenChange={(next) => !issue.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle>Issue {asset?.tag}</DialogTitle>
          <DialogDescription>{asset?.model}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <select value={userId} onChange={(event) => setUserId(event.target.value)} aria-label="Issue to" className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
            <option value="">Choose a person…</option>
            {getActiveUsers()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.designation}
                </option>
              ))}
          </select>
          <Input value={requestKey} onChange={(event) => setRequestKey(event.target.value)} placeholder="Request key (optional), e.g. ADM-107" aria-label="Request key" className={fieldClass} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={issue.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!userId || issue.isPending}
            onClick={() => asset && issue.mutate({ id: asset.id, userId, requestKey: requestKey.trim().toUpperCase() || undefined }, { onSuccess: () => onOpenChange(false) })}
            className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
          >
            Issue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ asset, onOpenChange }: { asset: Asset | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!asset} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>{asset?.tag} history</DialogTitle>
          <DialogDescription>{asset?.model}</DialogDescription>
        </DialogHeader>
        <ol className="max-h-80 space-y-3 overflow-y-auto text-sm">
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
      </DialogContent>
    </Dialog>
  );
}

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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asset Log</h1>
            <p className="mt-2 text-gray-600">Which asset is issued to whom: laptops, monitors, headsets, ID and access cards</p>
          </div>
          <Button onClick={() => setAdding(true)} className="gap-2 bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            <Plus className="h-4 w-4" />
            Add asset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(
            [
              ['', 'All assets', assets.length],
              ['issued', 'Issued', count('issued')],
              ['in-stock', 'In stock', count('in-stock')],
              ['in-repair', 'In repair', count('in-repair')],
            ] as const
          ).map(([value, label, total]) => (
            <button
              key={label}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatusFilter(value)}
              className={cn('rounded-xl border bg-white p-4 text-left shadow-sm hover:border-[#464EB8]/40', status === value ? 'border-[#464EB8] ring-1 ring-[#464EB8]' : 'border-gray-200')}
            >
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{total}</p>
            </button>
          ))}
        </div>

        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tag, model, serial or person…"
                aria-label="Search assets"
                className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </div>
            <select value={type} onChange={(event) => setType(event.target.value as AssetType | '')} aria-label="Type" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">All types</option>
              {ASSET_TYPES.map((value) => (
                <option key={value} value={value}>
                  {ASSET_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            <select value={status} onChange={(event) => setStatusFilter(event.target.value as AssetStatus | '')} aria-label="Status" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
              <option value="">Any status</option>
              {(Object.keys(ASSET_STATUS_LABELS) as AssetStatus[]).map((value) => (
                <option key={value} value={value}>
                  {ASSET_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

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
          <div className="ionixx-scrollbar relative overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
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
                {shown.map((asset) => (
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
                          {asset.status === 'in-stock' && <DropdownMenuItem onSelect={() => setIssuing(asset)}>Issue to someone…</DropdownMenuItem>}
                          {asset.status === 'issued' && <DropdownMenuItem onSelect={() => giveBack.mutate({ id: asset.id })}>Record as returned</DropdownMenuItem>}
                          {(asset.status === 'in-stock' || asset.status === 'in-repair') && (
                            <DropdownMenuItem onSelect={() => setStatus.mutate({ id: asset.id, status: asset.status === 'in-repair' ? 'in-stock' : 'in-repair' })}>
                              {asset.status === 'in-repair' ? 'Back in stock' : 'Send for repair'}
                            </DropdownMenuItem>
                          )}
                          {(asset.status === 'in-stock' || asset.status === 'in-repair') && (
                            <DropdownMenuItem onSelect={() => setRetiring(asset)} className="text-red-600">
                              Retire
                            </DropdownMenuItem>
                          )}
                          {asset.status !== 'retired' && <DropdownMenuSeparator />}
                          <DropdownMenuItem onSelect={() => setHistoryOf(asset)}>
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
        )}
      </div>

      <AddAssetDialog open={adding} onOpenChange={setAdding} />
      <IssueDialog asset={issuing} onOpenChange={(open) => !open && setIssuing(null)} />
      <HistoryDialog asset={historyOf} onOpenChange={(open) => !open && setHistoryOf(null)} />
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
