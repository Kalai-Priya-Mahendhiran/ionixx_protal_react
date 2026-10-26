import { AlertTriangle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RESTRICTED_HOLIDAY_NOTE } from '@/lib/constants';

export function RestrictedHolidayInfo() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={RESTRICTED_HOLIDAY_NOTE.title}
          className="inline-flex rounded-full text-amber-600 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs border-amber-200 bg-white p-0 shadow-xl">
        <div className="rounded-t-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {RESTRICTED_HOLIDAY_NOTE.title}
        </div>
        <div className="space-y-2 px-3 py-2.5 text-xs leading-relaxed text-gray-700">
          <p>{RESTRICTED_HOLIDAY_NOTE.description}</p>
          <p className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 font-medium text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {RESTRICTED_HOLIDAY_NOTE.warning}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
