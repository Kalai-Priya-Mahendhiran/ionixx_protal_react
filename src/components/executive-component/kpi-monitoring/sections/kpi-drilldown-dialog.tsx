import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/ui/sheet";
import { KPI_STATUS_CONFIG } from "@/lib/constants";
import { categoryConfig, type Kpi } from "./kpi-meta";
import { formatDate, getStatusHex } from "./kpi-utils";
import { SparklineLarge } from "./kpi-sparklines";

export function KpiDrilldownDialog({ kpi, onClose }: { kpi: Kpi; onClose: () => void }) {
  const cfg = KPI_STATUS_CONFIG[kpi.status];
  const catCfg = categoryConfig[kpi.category];
  const progress = kpi.higherIsBetter
    ? Math.min(100, (kpi.current / kpi.target) * 100)
    : Math.min(100, (kpi.target / kpi.current) * 100);

  return (
    <AppSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={kpi.name}
      description={kpi.description}
      width="lg"
      header={
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 pr-14 text-white">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-white/20 text-white`}>
            {catCfg.icon}
            {catCfg.label}
          </span>
          <h2 className="text-2xl font-bold mt-2">{kpi.name}</h2>
          <p className="text-sm text-white/90 mt-1">{kpi.description}</p>
        </div>
      }
      footer={
        <>
          <Button variant="outline" className="flex-1">
            Configure alert
          </Button>
          <Button className="flex-1 bg-[#464EB8] hover:bg-[#3a3f9a]">
            View full report
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Current" value={`${kpi.current}${kpi.unit}`} />
          <Stat label="Target" value={`${kpi.target}${kpi.unit}`} />
          <Stat
            label="Status"
            value={cfg.label}
            valueClass={
              kpi.status === "on-track"
                ? "text-green-600"
                : kpi.status === "at-risk"
                ? "text-amber-600"
                : "text-red-600"
            }
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
            Progress to target
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${cfg.bar}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {progress.toFixed(0)}% of target — {kpi.higherIsBetter ? "higher is better" : "lower is better"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-3">
            Last 6 periods
          </p>
          <SparklineLarge values={kpi.history} color={getStatusHex(kpi.status)} />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-3">
            Department drilldown
          </p>
          <ul className="space-y-2">
            {kpi.drilldown.map((d) => {
              const dcfg = KPI_STATUS_CONFIG[d.status];
              return (
                <li
                  key={d.label}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">{d.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {d.value}
                      {kpi.unit}
                    </span>
                    <Badge className={dcfg.tone}>{dcfg.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-gray-500">Owner</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{kpi.owner}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(kpi.lastUpdated)}
            </p>
          </div>
        </div>
      </div>
    </AppSheet>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  );
}
