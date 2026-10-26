import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ASSET_STATUS_LABELS, ASSET_TYPES, ASSET_TYPE_LABELS } from '@/lib/desk-config';
import type { AssetStatus, AssetType } from '@/types';

interface AssetFiltersSectionProps {
  search: string;
  onSearchChange: (search: string) => void;
  type: AssetType | '';
  onTypeChange: (type: AssetType | '') => void;
  status: AssetStatus | '';
  onStatusChange: (status: AssetStatus | '') => void;
}

export function AssetFiltersSection({ search, onSearchChange, type, onTypeChange, status, onStatusChange }: AssetFiltersSectionProps) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tag, model, serial or person…"
            aria-label="Search assets"
            className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          />
        </div>
        <select value={type} onChange={(event) => onTypeChange(event.target.value as AssetType | '')} aria-label="Type" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="">All types</option>
          {ASSET_TYPES.map((value) => (
            <option key={value} value={value}>
              {ASSET_TYPE_LABELS[value]}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as AssetStatus | '')} aria-label="Status" className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm">
          <option value="">Any status</option>
          {(Object.keys(ASSET_STATUS_LABELS) as AssetStatus[]).map((value) => (
            <option key={value} value={value}>
              {ASSET_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </CardContent>
    </Card>
  );
}
