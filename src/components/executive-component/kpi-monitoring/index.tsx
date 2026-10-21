import { useMemo, useState } from "react";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Target,
  Bell,
  Filter,
  ArrowRight,
  Activity,
  Users,
  Clock,
  Award,
  DollarSign,
  Zap,
  ChevronRight,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { AppSheet } from "@/components/ui/sheet";
import { KPI_STATUS_CONFIG } from "@/lib/constants";

type Status = "on-track" | "at-risk" | "off-track";
type Category = "all" | "people" | "performance" | "financial" | "operations";
type Trend = "up" | "down" | "flat";

interface Kpi {
  id: string;
  name: string;
  category: Exclude<Category, "all">;
  current: number;
  target: number;
  unit: string;
  status: Status;
  trend: Trend;
  changePct: number;
  history: number[];
  owner: string;
  lastUpdated: string;
  description: string;
  higherIsBetter: boolean;
  drilldown: { label: string; value: number; status: Status }[];
}

interface AlertItem {
  id: string;
  kpiName: string;
  severity: "high" | "medium" | "low";
  message: string;
  raisedAt: string;
}

const kpis: Kpi[] = [
  {
    id: "kpi-001",
    name: "Attrition Rate",
    category: "people",
    current: 1.6,
    target: 1.5,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 6.7,
    history: [1.4, 1.3, 1.4, 1.3, 1.5, 1.6],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-07",
    description: "Monthly attrition rate across all departments.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 1.4, status: "on-track" },
      { label: "Sales", value: 2.4, status: "off-track" },
      { label: "Design", value: 1.1, status: "on-track" },
      { label: "Quality", value: 1.8, status: "at-risk" },
    ],
  },
  {
    id: "kpi-002",
    name: "Productivity Index",
    category: "performance",
    current: 89.2,
    target: 90,
    unit: "",
    status: "on-track",
    trend: "up",
    changePct: 2.1,
    history: [85, 86, 87, 87, 88, 89.2],
    owner: "Priya Kumar",
    lastUpdated: "2026-05-07",
    description: "Composite productivity score across teams.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 92, status: "on-track" },
      { label: "Design", value: 88, status: "on-track" },
      { label: "HR", value: 94, status: "on-track" },
      { label: "Sales", value: 85, status: "at-risk" },
    ],
  },
  {
    id: "kpi-003",
    name: "Time-to-Hire",
    category: "people",
    current: 38,
    target: 30,
    unit: " days",
    status: "off-track",
    trend: "up",
    changePct: 8.6,
    history: [32, 33, 35, 36, 37, 38],
    owner: "Sneha Iyer",
    lastUpdated: "2026-05-06",
    description: "Average days from job posting to offer acceptance.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 42, status: "off-track" },
      { label: "Design", value: 28, status: "on-track" },
      { label: "Sales", value: 35, status: "at-risk" },
      { label: "HR", value: 25, status: "on-track" },
    ],
  },
  {
    id: "kpi-004",
    name: "Employee Satisfaction",
    category: "people",
    current: 4.2,
    target: 4.0,
    unit: "/5",
    status: "on-track",
    trend: "up",
    changePct: 5.0,
    history: [3.9, 4.0, 4.0, 4.1, 4.1, 4.2],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-05",
    description: "eNPS-style rating from quarterly pulse survey.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 4.3, status: "on-track" },
      { label: "Design", value: 4.5, status: "on-track" },
      { label: "Sales", value: 3.8, status: "at-risk" },
      { label: "HR", value: 4.4, status: "on-track" },
    ],
  },
  {
    id: "kpi-005",
    name: "Revenue per Employee",
    category: "financial",
    current: 142,
    target: 150,
    unit: "K",
    status: "at-risk",
    trend: "flat",
    changePct: 0.7,
    history: [138, 139, 141, 140, 141, 142],
    owner: "Vivek Mehta",
    lastUpdated: "2026-05-04",
    description: "Annualized revenue divided by total headcount (USD).",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 168, status: "on-track" },
      { label: "Sales", value: 195, status: "on-track" },
      { label: "Design", value: 96, status: "off-track" },
      { label: "HR", value: 0, status: "on-track" },
    ],
  },
  {
    id: "kpi-006",
    name: "Training Completion",
    category: "operations",
    current: 82,
    target: 85,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 3.8,
    history: [76, 77, 78, 79, 80, 82],
    owner: "Anita Rajan",
    lastUpdated: "2026-05-07",
    description: "Mandatory training course completion rate.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 88, status: "on-track" },
      { label: "Design", value: 75, status: "off-track" },
      { label: "Sales", value: 80, status: "at-risk" },
      { label: "HR", value: 95, status: "on-track" },
    ],
  },
  {
    id: "kpi-007",
    name: "Goal Achievement",
    category: "performance",
    current: 76,
    target: 80,
    unit: "%",
    status: "at-risk",
    trend: "up",
    changePct: 4.1,
    history: [70, 71, 72, 74, 75, 76],
    owner: "Priya Kumar",
    lastUpdated: "2026-05-06",
    description: "Percentage of employees meeting quarterly goals.",
    higherIsBetter: true,
    drilldown: [
      { label: "Engineering", value: 82, status: "on-track" },
      { label: "Design", value: 78, status: "at-risk" },
      { label: "Sales", value: 68, status: "off-track" },
      { label: "HR", value: 88, status: "on-track" },
    ],
  },
  {
    id: "kpi-008",
    name: "Absenteeism Rate",
    category: "operations",
    current: 2.3,
    target: 2.5,
    unit: "%",
    status: "on-track",
    trend: "down",
    changePct: -8.0,
    history: [2.6, 2.5, 2.5, 2.4, 2.4, 2.3],
    owner: "Sneha Iyer",
    lastUpdated: "2026-05-07",
    description: "Unplanned absences as percentage of working days.",
    higherIsBetter: false,
    drilldown: [
      { label: "Engineering", value: 2.0, status: "on-track" },
      { label: "Design", value: 2.4, status: "on-track" },
      { label: "Sales", value: 2.8, status: "at-risk" },
      { label: "HR", value: 1.8, status: "on-track" },
    ],
  },
];

const alerts: AlertItem[] = [
  {
    id: "alt-1",
    kpiName: "Time-to-Hire",
    severity: "high",
    message: "Engineering exceeded target by 12 days — recruitment review recommended.",
    raisedAt: "2026-05-07",
  },
  {
    id: "alt-2",
    kpiName: "Attrition Rate",
    severity: "medium",
    message: "Sales department attrition at 2.4% — above 2% threshold.",
    raisedAt: "2026-05-06",
  },
  {
    id: "alt-3",
    kpiName: "Goal Achievement",
    severity: "medium",
    message: "Sales team trending below 70% goal completion.",
    raisedAt: "2026-05-05",
  },
  {
    id: "alt-4",
    kpiName: "Training Completion",
    severity: "low",
    message: "Design team behind schedule on compliance training.",
    raisedAt: "2026-05-04",
  },
];

const categoryConfig: Record<Exclude<Category, "all">, { label: string; icon: React.ReactNode; tone: string }> = {
  people: {
    label: "People",
    icon: <Users className="h-4 w-4" />,
    tone: "bg-indigo-100 text-indigo-700",
  },
  performance: {
    label: "Performance",
    icon: <Award className="h-4 w-4" />,
    tone: "bg-cyan-100 text-cyan-700",
  },
  financial: {
    label: "Financial",
    icon: <DollarSign className="h-4 w-4" />,
    tone: "bg-amber-100 text-amber-700",
  },
  operations: {
    label: "Operations",
    icon: <Activity className="h-4 w-4" />,
    tone: "bg-purple-100 text-purple-700",
  },
};

export default function KpiMonitoring() {
  const [category, setCategory] = useState<Category>("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<Kpi | null>(null);

  const filtered = useMemo(() => {
    return kpis.filter((k) => {
      const matchCat = category === "all" || k.category === category;
      const matchStatus = statusFilter === "all" || k.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [category, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: kpis.length,
      onTrack: kpis.filter((k) => k.status === "on-track").length,
      atRisk: kpis.filter((k) => k.status === "at-risk").length,
      offTrack: kpis.filter((k) => k.status === "off-track").length,
    };
  }, []);

  // Clicking the active status card again goes back to all statuses
  const toggleStatus = (status: Status) =>
    setStatusFilter((current) => (current === status ? "all" : status));

  const overallHealth =Math.round((counts.onTrack / counts.total) * 100);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Gauge}
          title="KPI Monitoring"
          description="Track workforce KPIs — attrition, productivity, and more"
          actions={
            <>
              <div className="rounded-md border border-white/30 bg-white/15 px-3 py-1">
                <p className="text-[10px] text-white/80 uppercase tracking-wider">Overall Health</p>
                <p className="text-lg font-bold leading-tight">{overallHealth}%</p>
              </div>
              <Button className={headerPrimaryButtonClass}>
                <Bell className="h-4 w-4 mr-2" />
                Alerts ({alerts.length})
              </Button>
            </>
          }
        />

        <StatGrid>
          {/* The cards share the status select's filter (combined with the category toggle) */}
          <StatCard
            icon={Target}
            label="Total KPIs"
            value={counts.total}
            tone="indigo"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatCard
            icon={CheckCircle2}
            label="On Track"
            value={counts.onTrack}
            tone="green"
            active={statusFilter === "on-track"}
            onClick={() => toggleStatus("on-track")}
          />
          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={counts.atRisk}
            tone="amber"
            active={statusFilter === "at-risk"}
            onClick={() => toggleStatus("at-risk")}
          />
          <StatCard
            icon={Zap}
            label="Off Track"
            value={counts.offTrack}
            tone="red"
            active={statusFilter === "off-track"}
            onClick={() => toggleStatus("off-track")}
          />
        </StatGrid>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span>Active Alerts</span>
              </CardTitle>
              <CardDescription>KPIs requiring attention this period</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <span
                      className={`mt-0.5 p-1.5 rounded-md ${
                        alert.severity === "high"
                          ? "bg-red-100 text-red-600"
                          : alert.severity === "medium"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900">{alert.kpiName}</p>
                        <Badge
                          className={
                            alert.severity === "high"
                              ? "bg-red-100 text-red-700 text-[10px] py-0"
                              : alert.severity === "medium"
                              ? "bg-amber-100 text-amber-700 text-[10px] py-0"
                              : "bg-blue-100 text-blue-700 text-[10px] py-0"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(alert.raisedAt)}</p>
                    </div>
                    <button className="text-[#464EB8] text-xs font-medium hover:underline flex items-center gap-0.5 flex-shrink-0">
                      View <ChevronRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#464EB8]" />
                <span>Health Distribution</span>
              </CardTitle>
              <CardDescription>KPI status across portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <HealthBar
                  label="On track"
                  count={counts.onTrack}
                  total={counts.total}
                  color="bg-green-500"
                />
                <HealthBar
                  label="At risk"
                  count={counts.atRisk}
                  total={counts.total}
                  color="bg-amber-500"
                />
                <HealthBar
                  label="Off track"
                  count={counts.offTrack}
                  total={counts.total}
                  color="bg-red-500"
                />
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">By Category</p>
                <ul className="space-y-2">
                  {(Object.keys(categoryConfig) as Exclude<Category, "all">[]).map((cat) => {
                    const items = kpis.filter((k) => k.category === cat);
                    return (
                      <li key={cat} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded ${categoryConfig[cat].tone}`}>
                            {categoryConfig[cat].icon}
                          </span>
                          <span className="text-gray-700">{categoryConfig[cat].label}</span>
                        </div>
                        <span className="text-xs text-gray-500">{items.length} KPIs</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selected && <KpiDrilldown kpi={selected} onClose={() => setSelected(null)} />}
    </MainLayout>
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

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const W = 70;
  const H = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = W / (values.length - 1 || 1);
  const path = values
    .map((v, i) => {
      const x = i * stepX;
      const y = H - ((v - min) / range) * H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function HealthBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="text-gray-500">
          {count}/{total} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KpiDrilldown({ kpi, onClose }: { kpi: Kpi; onClose: () => void }) {
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

function SparklineLarge({ values, color }: { values: number[]; color: string }) {
  const W = 460;
  const H = 90;
  const PAD = 8;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = innerW / (values.length - 1 || 1);
  const coords = values.map((v, i) => ({
    x: PAD + i * stepX,
    y: PAD + innerH - ((v - min) / range) * innerH,
    value: v,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const area = `${path} L ${coords[coords.length - 1].x} ${PAD + innerH} L ${coords[0].x} ${PAD + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-grad)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
            {c.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

function getStatusHex(status: Status): string {
  return status === "on-track" ? "#22c55e" : status === "at-risk" ? "#f59e0b" : "#ef4444";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
