import { Card, CardContent } from '@/components/ui/card';
import type { SlaStatus } from '@/lib/sla';
import { formatDateTime } from '@/lib/utils';
import { SlaChip } from '@/components/admin-component/service-desk/sections/desk-badges';

export function SlaSection({ sla }: { sla: SlaStatus }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <h2 className="text-base font-semibold text-gray-900">SLA</h2>
        {(
          [
            ['First response', sla.response],
            ['Resolution', sla.resolution],
          ] as const
        ).map(([label, clock]) => (
          <div key={label} className="space-y-1">
            <p className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{label}</span>
              <span className="text-xs text-gray-500">target {Math.round((clock.targetMs / 3600000) * 10) / 10}h</span>
            </p>
            <SlaChip clock={clock} />
            {!clock.stoppedAt && clock.state !== 'breached' && <p className="text-xs text-gray-500">Due {formatDateTime(clock.dueAt)}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
