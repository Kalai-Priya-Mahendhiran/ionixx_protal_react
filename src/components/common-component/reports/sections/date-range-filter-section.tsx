import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { REPORT_DATE_RANGES } from '@/lib/constants';

interface DateRangeFilterSectionProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function DateRangeFilterSection({ dateRange, onDateRangeChange }: DateRangeFilterSectionProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {REPORT_DATE_RANGES.map(range => (
                <option key={range.id} value={range.id}>{range.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
