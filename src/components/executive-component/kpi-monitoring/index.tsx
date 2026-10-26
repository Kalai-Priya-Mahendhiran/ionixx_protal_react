import { useMemo, useState } from "react";
import {
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Target,
  Bell,
  Zap,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { alerts, kpis, type Category, type Kpi, type Status } from "./sections/kpi-meta";
import {
  ActiveAlertsSection,
  HealthDistributionSection,
  KpiDashboardSection,
  KpiDrilldownDialog,
} from "./sections";

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

        <KpiDashboardSection
          category={category}
          setCategory={setCategory}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filtered={filtered}
          setSelected={setSelected}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ActiveAlertsSection />

          <HealthDistributionSection counts={counts} />
        </div>
      </div>

      {selected && <KpiDrilldownDialog kpi={selected} onClose={() => setSelected(null)} />}
    </MainLayout>
  );
}
