import type { Asset, AssetStatus } from '@/types';

export const STATUS_STYLE: Record<AssetStatus, string> = {
  'in-stock': 'bg-green-100 text-green-800',
  issued: 'bg-indigo-100 text-indigo-800',
  'in-repair': 'bg-amber-100 text-amber-900',
  retired: 'bg-gray-100 text-gray-600',
};

export const HISTORY_LABELS: Record<Asset['history'][number]['action'], string> = {
  added: 'Added to the log',
  issued: 'Issued',
  returned: 'Returned',
  repair: 'Sent for repair',
  retired: 'Retired',
  updated: 'Updated',
};
