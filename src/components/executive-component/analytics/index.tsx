import { useMemo, useState } from "react";
import {
  LineChart,
  TrendingUp,
  Users,
  UserMinus,
  Download,
  Calendar,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { trendData, type Period, type WorkforceMetric } from "./sections/analytics-meta";
import {
  DepartmentBreakdownSection,
  ForecastSection,
  HeadcountDistributionSection,
  KeyInsightsSection,
  WorkforceTrendSection,
} from "./sections";

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("6M");
  const [activeMetric, setActiveMetric] = useState<WorkforceMetric>("headcount");

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

        <WorkforceTrendSection
          points={points}
          activeMetric={activeMetric}
          setActiveMetric={setActiveMetric}
          maxValue={maxValue}
          minHeadcount={minHeadcount}
        />

        <ForecastSection />

        <DepartmentBreakdownSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HeadcountDistributionSection />

          <KeyInsightsSection />
        </div>
      </div>
    </MainLayout>
  );
}
