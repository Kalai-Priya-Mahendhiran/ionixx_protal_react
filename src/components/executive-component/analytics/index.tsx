import { useMemo, useState } from "react";
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  UserMinus,
  DollarSign,
  Building2,
  Download,
  Calendar,
  Briefcase,
  Target,
  PieChart as PieIcon,
  BarChart3,
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

type Period = "1M" | "3M" | "6M" | "1Y";

interface TrendPoint {
  label: string;
  headcount: number;
  hires: number;
  exits: number;
  attritionRate: number;
}

interface DepartmentMetric {
  name: string;
  headcount: number;
  hires: number;
  exits: number;
  productivity: number;
  budgetUsed: number;
  color: string;
}

interface ForecastPoint {
  label: string;
  actual: number | null;
  forecast: number;
}

const trendData: Record<Period, TrendPoint[]> = {
  "1M": [
    { label: "Wk 1", headcount: 312, hires: 4, exits: 1, attritionRate: 0.3 },
    { label: "Wk 2", headcount: 314, hires: 3, exits: 1, attritionRate: 0.3 },
    { label: "Wk 3", headcount: 316, hires: 2, exits: 0, attritionRate: 0.0 },
    { label: "Wk 4", headcount: 318, hires: 3, exits: 1, attritionRate: 0.3 },
  ],
  "3M": [
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
  "6M": [
    { label: "Dec", headcount: 280, hires: 8, exits: 6, attritionRate: 2.1 },
    { label: "Jan", headcount: 287, hires: 12, exits: 5, attritionRate: 1.8 },
    { label: "Feb", headcount: 294, hires: 11, exits: 4, attritionRate: 1.4 },
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
  "1Y": [
    { label: "Jun", headcount: 246, hires: 7, exits: 5, attritionRate: 2.0 },
    { label: "Jul", headcount: 252, hires: 9, exits: 3, attritionRate: 1.2 },
    { label: "Aug", headcount: 258, hires: 8, exits: 2, attritionRate: 0.8 },
    { label: "Sep", headcount: 265, hires: 10, exits: 3, attritionRate: 1.1 },
    { label: "Oct", headcount: 271, hires: 9, exits: 3, attritionRate: 1.1 },
    { label: "Nov", headcount: 276, hires: 8, exits: 3, attritionRate: 1.1 },
    { label: "Dec", headcount: 280, hires: 8, exits: 6, attritionRate: 2.1 },
    { label: "Jan", headcount: 287, hires: 12, exits: 5, attritionRate: 1.8 },
    { label: "Feb", headcount: 294, hires: 11, exits: 4, attritionRate: 1.4 },
    { label: "Mar", headcount: 298, hires: 9, exits: 4, attritionRate: 1.4 },
    { label: "Apr", headcount: 305, hires: 11, exits: 4, attritionRate: 1.3 },
    { label: "May", headcount: 318, hires: 18, exits: 5, attritionRate: 1.6 },
  ],
};

const departmentMetrics: DepartmentMetric[] = [
  { name: "Engineering", headcount: 142, hires: 18, exits: 6, productivity: 92, budgetUsed: 78, color: "#464EB8" },
  { name: "Design", headcount: 28, hires: 4, exits: 1, productivity: 88, budgetUsed: 64, color: "#3FCCE8" },
  { name: "Quality", headcount: 36, hires: 5, exits: 2, productivity: 90, budgetUsed: 71, color: "#22c55e" },
  { name: "Sales", headcount: 42, hires: 7, exits: 3, productivity: 85, budgetUsed: 82, color: "#f59e0b" },
  { name: "HR", headcount: 14, hires: 2, exits: 0, productivity: 94, budgetUsed: 58, color: "#a855f7" },
  { name: "Infrastructure", headcount: 22, hires: 3, exits: 1, productivity: 89, budgetUsed: 73, color: "#ef4444" },
  { name: "Finance", headcount: 18, hires: 1, exits: 1, productivity: 91, budgetUsed: 67, color: "#0ea5e9" },
  { name: "Marketing", headcount: 16, hires: 2, exits: 1, productivity: 86, budgetUsed: 70, color: "#ec4899" },
];

const headcountForecast: ForecastPoint[] = [
  { label: "Mar", actual: 298, forecast: 298 },
  { label: "Apr", actual: 305, forecast: 304 },
  { label: "May", actual: 318, forecast: 312 },
  { label: "Jun", actual: null, forecast: 326 },
  { label: "Jul", actual: null, forecast: 334 },
  { label: "Aug", actual: null, forecast: 341 },
];

const attritionForecast: ForecastPoint[] = [
  { label: "Mar", actual: 1.4, forecast: 1.4 },
  { label: "Apr", actual: 1.3, forecast: 1.5 },
  { label: "May", actual: 1.6, forecast: 1.6 },
  { label: "Jun", actual: null, forecast: 1.7 },
  { label: "Jul", actual: null, forecast: 1.8 },
  { label: "Aug", actual: null, forecast: 1.6 },
];

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("6M");
  const [activeMetric, setActiveMetric] = useState<"headcount" | "hires" | "exits">("headcount");

  const points = trendData[period];

  const summary = useMemo(() => {
    const last = points[points.length - 1];
    const first = points[0];
    const totalHires = points.reduce((sum, p) => sum + p.hires, 0);
    const totalExits = points.reduce((sum, p) => sum + p.exits, 0);
    const avgAttrition =
      points.reduce((sum, p) => sum + p.attritionRate, 0) / points.length;
    const headcountChange = last.headcount - first.headcount;
    const headcountChangePct = ((headcountChange / first.headcount) * 100).toFixed(1);
    return {
      currentHeadcount: last.headcount,
      headcountChange,
      headcountChangePct,
      totalHires,
      totalExits,
      avgAttrition: avgAttrition.toFixed(2),
      netGrowth: totalHires - totalExits,
    };
  }, [points]);

  const maxValue = useMemo(() => {
    if (activeMetric === "headcount") {
      return Math.max(...points.map((p) => p.headcount));
    }
    return Math.max(...points.map((p) => Math.max(p.hires, p.exits)));
  }, [points, activeMetric]);

  const minHeadcount = useMemo(
    () => Math.min(...points.map((p) => p.headcount)) - 10,
    [points]
  );

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={LineChart}
          title="Analytics"
          description="Workforce trends, forecasting, and department insights"
          actions={
            <>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-1 flex gap-1">
                {(["1M", "3M", "6M", "1Y"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      period === p
                        ? "bg-white text-[#464EB8]"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button className={headerPrimaryButtonClass}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          }
        />

        <StatGrid>
          <StatCard
            icon={Users}
            label="Total Headcount"
            value={summary.currentHeadcount}
            hint={`${summary.headcountChange >= 0 ? "+" : ""}${summary.headcountChange} (${summary.headcountChangePct}%)`}
            tone="indigo"
          />
          <StatCard
            icon={TrendingUp}
            label="New Hires"
            value={summary.totalHires}
            hint={`+${summary.netGrowth} net`}
            tone="green"
          />
          <StatCard
            icon={UserMinus}
            label="Attrition Rate"
            value={`${summary.avgAttrition}%`}
            hint={`${summary.totalExits} exits`}
            tone="orange"
          />
          <StatCard icon={Calendar} label="Avg. Tenure" value="2.8 yr" hint="+0.2 yr YoY" tone="sky" />
        </StatGrid>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#464EB8]" />
                  <span>Workforce Trend</span>
                </CardTitle>
                <CardDescription>
                  Headcount, hires, and exits over time
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {(["headcount", "hires", "exits"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setActiveMetric(m)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      activeMetric === m
                        ? "bg-[#464EB8] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 relative">
              {activeMetric === "headcount" ? (
                <SvgLineChart
                  points={points.map((p) => ({ label: p.label, value: p.headcount }))}
                  min={minHeadcount}
                  max={maxValue + 5}
                  color="#464EB8"
                  fillId="headcount-grad"
                />
              ) : (
                <SvgBarChart
                  points={points.map((p) => ({
                    label: p.label,
                    value: activeMetric === "hires" ? p.hires : p.exits,
                  }))}
                  max={maxValue + 2}
                  color={activeMetric === "hires" ? "#22c55e" : "#ef4444"}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#464EB8]" />
                <span>Headcount Forecast</span>
              </CardTitle>
              <CardDescription>
                Projected growth — next 3 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForecastChart data={headcountForecast} color="#464EB8" suffix="" />
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs font-medium text-indigo-900">
                  Projected: <span className="font-bold">+23 employees</span> by Aug 2026
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Based on current hiring velocity and attrition trends
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-orange-500" />
                <span>Attrition Forecast</span>
              </CardTitle>
              <CardDescription>
                Expected attrition trend (%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForecastChart data={attritionForecast} color="#f59e0b" suffix="%" />
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-xs font-medium text-orange-900">
                  Watch zone: <span className="font-bold">1.6% – 1.8%</span> through Q3
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Sales and Engineering are showing elevated risk
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#464EB8]" />
              <span>Department Breakdown</span>
            </CardTitle>
            <CardDescription>
              Headcount, hiring activity, and budget utilization by team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2">Headcount</th>
                    <th className="py-3 px-2">Hires</th>
                    <th className="py-3 px-2">Exits</th>
                    <th className="py-3 px-2">Productivity</th>
                    <th className="py-3 px-2">Budget Used</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentMetrics.map((d) => (
                    <tr key={d.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span className="font-medium text-gray-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-700 font-semibold">
                        {d.headcount}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-green-600 font-medium">+{d.hires}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-red-500 font-medium">−{d.exits}</span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${d.productivity}%`,
                                background: d.color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-10">{d.productivity}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={
                            d.budgetUsed > 80
                              ? "bg-red-100 text-red-700"
                              : d.budgetUsed > 70
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }
                        >
                          {d.budgetUsed}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieIcon className="h-5 w-5 text-[#464EB8]" />
                <span>Headcount Distribution</span>
              </CardTitle>
              <CardDescription>Share of workforce by department</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionChart data={departmentMetrics} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#464EB8]" />
                <span>Key Insights</span>
              </CardTitle>
              <CardDescription>Auto-generated highlights for this period</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <Insight
                  icon={<TrendingUp className="h-4 w-4 text-green-600" />}
                  title="Engineering grew fastest"
                  body="18 new hires this quarter — driven by platform expansion."
                  tone="bg-green-50"
                />
                <Insight
                  icon={<TrendingDown className="h-4 w-4 text-orange-600" />}
                  title="Sales attrition up 0.4 pts"
                  body="Three exits in May — recommend targeted retention review."
                  tone="bg-orange-50"
                />
                <Insight
                  icon={<DollarSign className="h-4 w-4 text-amber-600" />}
                  title="Sales budget at 82%"
                  body="Approaching threshold — flag for finance review before next hire."
                  tone="bg-amber-50"
                />
                <Insight
                  icon={<Users className="h-4 w-4 text-indigo-600" />}
                  title="HR productivity leads"
                  body="94% productivity score — highest across all teams this period."
                  tone="bg-indigo-50"
                />
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

function SvgLineChart({
  points,
  min,
  max,
  color,
  fillId,
}: {
  points: { label: string; value: number }[];
  min: number;
  max: number;
  color: string;
  fillId: string;
}) {
  const W = 800;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = innerW / (points.length - 1 || 1);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - ((p.value - min) / range) * innerH,
    label: p.label,
    value: p.value,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${path} L ${coords[coords.length - 1].x} ${PAD.top + innerH} L ${coords[0].x} ${PAD.top + innerH} Z`;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = min + (range * i) / yTicks;
    return {
      y: PAD.top + innerH - ((v - min) / range) * innerH,
      value: Math.round(v),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {t.value}
          </text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#${fillId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text
            x={c.x}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SvgBarChart({
  points,
  max,
  color,
}: {
  points: { label: string; value: number }[];
  max: number;
  color: string;
}) {
  const W = 800;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barW = (innerW / points.length) * 0.6;
  const gap = innerW / points.length;

  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = (max * i) / yTicks;
    return {
      y: PAD.top + innerH - (v / max) * innerH,
      value: Math.round(v),
    };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            y1={t.y}
            x2={W - PAD.right}
            y2={t.y}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
            {t.value}
          </text>
        </g>
      ))}
      {points.map((p, i) => {
        const h = (p.value / max) * innerH;
        const x = PAD.left + i * gap + (gap - barW) / 2;
        const y = PAD.top + innerH - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="4" fill={color} opacity="0.85" />
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#334155"
            >
              {p.value}
            </text>
            <text
              x={x + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ForecastChart({
  data,
  color,
  suffix,
}: {
  data: ForecastPoint[];
  color: string;
  suffix: string;
}) {
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.actual ?? d.forecast, d.forecast]);
  const min = Math.min(...allValues) * 0.9;
  const max = Math.max(...allValues) * 1.05;
  const range = max - min || 1;
  const stepX = innerW / (data.length - 1 || 1);

  const actualCoords = data
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => d.actual !== null)
    .map(({ d, i }) => ({
      x: PAD.left + i * stepX,
      y: PAD.top + innerH - (((d.actual as number) - min) / range) * innerH,
    }));

  const forecastCoords = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - ((d.forecast - min) / range) * innerH,
  }));

  const actualPath = actualCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");
  const forecastPath = forecastCoords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD.top + innerH * (1 - t);
          const v = min + range * t;
          return (
            <g key={t}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text x={PAD.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">
                {v.toFixed(suffix === "%" ? 1 : 0)}
              </text>
            </g>
          );
        })}
        <path d={actualPath} fill="none" stroke={color} strokeWidth="2.5" />
        <path
          d={forecastPath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="5 4"
          opacity="0.7"
        />
        {actualCoords.map((c, i) => (
          <circle key={`a-${i}`} cx={c.x} cy={c.y} r="3.5" fill={color} />
        ))}
        {forecastCoords.map((c, i) => {
          const isForecast = data[i].actual === null;
          if (!isForecast) return null;
          return (
            <circle
              key={`f-${i}`}
              cx={c.x}
              cy={c.y}
              r="3.5"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        {data.map((d, i) => (
          <text
            key={i}
            x={PAD.left + i * stepX}
            y={H - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {d.label}
          </text>
        ))}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: color }} />
          <span className="text-gray-600">Actual</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-0.5 border-t border-dashed"
            style={{ borderColor: color }}
          />
          <span className="text-gray-600">Forecast</span>
        </span>
      </div>
    </div>
  );
}

function DistributionChart({ data }: { data: DepartmentMetric[] }) {
  const total = data.reduce((sum, d) => sum + d.headcount, 0);
  let cumulative = 0;
  const radius = 70;
  const cx = 90;
  const cy = 90;

  const segments = data.map((d) => {
    const fraction = d.headcount / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += fraction;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: d.color, name: d.name, value: d.headcount, pct: (fraction * 100).toFixed(1) };
  });

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-44 h-44 flex-shrink-0">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r="36" fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">
          Total
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#1e293b"
        >
          {total}
        </text>
      </svg>
      <ul className="flex-1 grid grid-cols-2 gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: s.color }}
            />
            <span className="text-gray-700 truncate flex-1">{s.name}</span>
            <span className="text-gray-500 text-xs">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Insight({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <li className={`flex items-start gap-3 p-3 rounded-lg ${tone}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{body}</p>
      </div>
    </li>
  );
}
