import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { REQUEST_CATEGORIES, REQUEST_CATEGORY_LABELS } from '@/lib/desk-config';
import { useSaveSla } from '@/services/apis/service-desk/use-service-desk';
import { validateSla } from '@/services/apis/service-desk/desk-settings-service';
import type { SlaTargets } from '@/types';
import { CATEGORY_ICONS } from './desk-icons';

type Draft = Record<string, { responseHours: string; resolutionHours: string }>;

const toDraft = (sla: SlaTargets): Draft =>
  Object.fromEntries(REQUEST_CATEGORIES.map((category) => [category, { responseHours: String(sla[category].responseHours), resolutionHours: String(sla[category].resolutionHours) }]));

const fromDraft = (draft: Draft): SlaTargets =>
  Object.fromEntries(
    REQUEST_CATEGORIES.map((category) => [category, { responseHours: Number(draft[category].responseHours), resolutionHours: Number(draft[category].resolutionHours) }]),
  ) as SlaTargets;

// Response and resolution targets per category (calendar hours; the clock pauses while Waiting)
export function SlaSettingsDialog({ open, onOpenChange, sla }: { open: boolean; onOpenChange: (open: boolean) => void; sla: SlaTargets }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(sla));
  const [error, setError] = useState('');
  const saveSla = useSaveSla();

  useEffect(() => {
    if (open) {
      setDraft(toDraft(sla));
      setError('');
    }
  }, [open, sla]);

  const save = () => {
    const targets = fromDraft(draft);
    try {
      validateSla(targets);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Check the targets');
      return;
    }
    saveSla.mutate(targets, { onSuccess: () => onOpenChange(false) });
  };

  const field = (category: string, key: 'responseHours' | 'resolutionHours', label: string) => (
    <input
      type="number"
      min={0.5}
      step={0.5}
      value={draft[category]?.[key] ?? ''}
      onChange={(event) => setDraft({ ...draft, [category]: { ...draft[category], [key]: event.target.value } })}
      aria-label={label}
      className="h-9 w-full rounded-md border border-gray-300 px-2 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
    />
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !saveSla.isPending && onOpenChange(next)}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>SLA targets</DialogTitle>
          <DialogDescription>Hours until the first response and until the request is resolved. The resolution clock pauses while a request is Waiting.</DialogDescription>
        </DialogHeader>
        <table className="w-full text-sm">
          <thead className="text-left text-xs font-semibold text-gray-600">
            <tr>
              <th className="py-1.5">Category</th>
              <th className="w-28 py-1.5 text-right">Respond (h)</th>
              <th className="w-28 py-1.5 text-right">Resolve (h)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {REQUEST_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const label = REQUEST_CATEGORY_LABELS[category];
              return (
                <tr key={category}>
                  <td className="py-1.5">
                    <span className="inline-flex items-center gap-2 text-gray-800">
                      <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      {label}
                    </span>
                  </td>
                  <td className="py-1.5 pl-2">{field(category, 'responseHours', `${label} response hours`)}</td>
                  <td className="py-1.5 pl-2">{field(category, 'resolutionHours', `${label} resolution hours`)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveSla.isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saveSla.isPending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
            {saveSla.isPending ? 'Saving…' : 'Save targets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
