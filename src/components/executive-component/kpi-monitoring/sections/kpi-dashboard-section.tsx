import { Filter, Gauge, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPI_STATUS_CONFIG } from "@/lib/constants";
import { categoryConfig, type Category, type Kpi, type Status } from "./kpi-meta";
import { getStatusHex } from "./kpi-utils";
import { Sparkline } from "./kpi-sparklines";

interface KpiDashboardSectionProps {
  category: Category;
  setCategory: (category: Category) => void;
  statusFilter: Status | "all";
  setStatusFilter: (status: Status | "all") => void;
  filtered: Kpi[];
  setSelected: (kpi: Kpi) => void;
}

export function KpiDashboardSection({
  category,
  setCategory,
  statusFilter,
  setStatusFilter,
  filtered,
  setSelected,
}: KpiDashboardSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-[#464EB8]" />
              <span>KPI Dashboard</span>
            </CardTitle>
            <CardDescription>
              Click any KPI to see department-level drilldown
            </CardDescription>
          </div>
          <div className="flex min-w-0 max-w-full items-center gap-2 flex-wrap">
            <div className="flex max-w-full items-center gap-1 overflow-x-auto bg-gray-100 rounded-lg p-1 [&>button]:shrink-0">
              {(["all", "people", "performance", "financial", "operations"] as Category[]).map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      category === c
                        ? "bg-white text-[#464EB8] shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {c}
                  </button>
                )
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            >
              <option value="all">All statuses</option>
              <option value="on-track">On track</option>
              <option value="at-risk">At risk</option>
              <option value="off-track">Off track</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Filter className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No KPIs match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((kpi) => (
              <KpiTile key={kpi.id} kpi={kpi} onClick={() => setSelected(kpi)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiTile({ kpi, onClick }: { kpi: Kpi; onClick: () => void }) {
  const cfg = KPI_STATUS_CONFIG[kpi.status];
  const catCfg = categoryConfig[kpi.category];
  const progress = kpi.higherIsBetter
    ? Math.min(100, (kpi.current / kpi.target) * 100)
    : Math.min(100, (kpi.target / kpi.current) * 100);

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[#464EB8]/30 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${catCfg.tone}`}>
            {catCfg.icon}
            {catCfg.label}
          </span>
          <p className="font-semibold text-gray-900 mt-2 text-sm leading-tight">{kpi.name}</p>
        </div>
        <Badge className={cfg.tone}>{cfg.label}</Badge>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-3xl font-bold text-gray-900">
          {kpi.current.toLocaleString()}
        </span>
        <span className="text-sm text-gray-500">{kpi.unit}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Target: {kpi.target}
        {kpi.unit}
      </p>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${cfg.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between">
        <Sparkline values={kpi.history} color={getStatusHex(kpi.status)} />
        <div className="flex items-center gap-1 text-xs">
          {kpi.trend === "up" ? (
            <TrendingUp
              className={`h-3.5 w-3.5 ${
                kpi.higherIsBetter ? "text-green-600" : "text-red-500"
              }`}
            />
          ) : kpi.trend === "down" ? (
            <TrendingDown
              className={`h-3.5 w-3.5 ${
                kpi.higherIsBetter ? "text-red-500" : "text-green-600"
              }`}
            />
          ) : (
            <Minus className="h-3.5 w-3.5 text-gray-400" />
          )}
          <span className="text-gray-600 font-medium">
            {kpi.changePct > 0 ? "+" : ""}
            {kpi.changePct}%
          </span>
        </div>
      </div>
    </button>
  );
}
