import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import type { IntegrationFormValues } from "@/lib/form-schemas/system";
import { AddIntegrationDialog, IntegrationDrawerSection, IntegrationsGridSection } from "./sections";
import { seedIntegrations, type Category, type Integration, type IntegrationStatus } from "./sections/integrations-meta";

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(seedIntegrations);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | IntegrationStatus>("all");
  const [selected, setSelected] = useState<Integration | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return integrations.filter((i) => {
      const matchesTerm =
        !term ||
        i.name.toLowerCase().includes(term) ||
        i.vendor.toLowerCase().includes(term);
      const matchesCategory =
        categoryFilter === "all" || i.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || i.status === statusFilter;
      return matchesTerm && matchesCategory && matchesStatus;
    });
  }, [integrations, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = integrations.length;
    const connected = integrations.filter((i) => i.status === "connected").length;
    const errors = integrations.filter((i) => i.status === "error").length;
    const syncedRecords = integrations.reduce((acc, i) => acc + i.recordsSynced, 0);
    return { total, connected, errors, syncedRecords };
  }, [integrations]);

  const handleSync = (i: Integration) => {
    if (i.status !== "connected") return;
    setIntegrations((prev) =>
      prev.map((x) =>
        x.id === i.id
          ? { ...x, lastSync: new Date().toISOString() }
          : x
      )
    );
    setSelected((s) =>
      s && s.id === i.id ? { ...s, lastSync: new Date().toISOString() } : s
    );
    toast.success(`${i.name} sync triggered.`);
  };

  const handleToggleStatus = (i: Integration) => {
    const next: IntegrationStatus =
      i.status === "connected" ? "disconnected" : "connected";
    setIntegrations((prev) =>
      prev.map((x) => (x.id === i.id ? { ...x, status: next } : x))
    );
    setSelected((s) => (s && s.id === i.id ? { ...s, status: next } : s));
    toast.success(
      next === "connected"
        ? `${i.name} reconnected.`
        : `${i.name} disconnected.`
    );
  };

  const handleAdd = (data: IntegrationFormValues) => {
    const newInt: Integration = {
      id: `INT-${String(integrations.length + 1).padStart(3, "0")}`,
      ...data,
      apiKey: data.apiKey.replace(/.(?=.{4})/g, "•"),
      status: "connected",
      description: `${data.vendor} integration.`,
      lastSync: null,
      recordsSynced: 0,
      icon: Plug,
    };
    setIntegrations((prev) => [newInt, ...prev]);
    setShowAddModal(false);
    toast.success(`${data.name} added.`);
  };

  const handleDelete = (id: string) => {
    const i = integrations.find((x) => x.id === id);
    if (!i) return;
    setIntegrations((prev) => prev.filter((x) => x.id !== id));
    setSelected(null);
    toast.success(`${i.name} removed.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Plug}
          title="Integrations"
          description={
            <>
              {stats.connected}/{stats.total} connected ·{" "}
              {stats.syncedRecords.toLocaleString()} records synced
            </>
          }
          actions={
            <Button
              onClick={() => setShowAddModal(true)}
              className={headerPrimaryButtonClass}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add integration
            </Button>
          }
        />

        <StatGrid>
          {/* The cards share the status select's filter; clicking the active card goes back to all */}
          <StatCard
            label="Total"
            value={stats.total}
            icon={Plug}
            tone="indigo"
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <StatCard
            label="Connected"
            value={stats.connected}
            icon={CheckCircle2}
            tone="green"
            active={statusFilter === "connected"}
            onClick={() => setStatusFilter((f) => (f === "connected" ? "all" : "connected"))}
          />
          <StatCard
            label="Errors"
            value={stats.errors}
            icon={AlertTriangle}
            tone="red"
            active={statusFilter === "error"}
            onClick={() => setStatusFilter((f) => (f === "error" ? "all" : "error"))}
          />
          <StatCard
            label="Records synced"
            value={stats.syncedRecords.toLocaleString()}
            icon={Zap}
            tone="amber"
          />
        </StatGrid>

        <IntegrationsGridSection
          integrations={filtered}
          search={search}
          onSearchChange={setSearch}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onConfigure={setSelected}
          onSync={handleSync}
        />
      </div>

      {selected && (
        <IntegrationDrawerSection
          integration={selected}
          onClose={() => setSelected(null)}
          onSync={() => handleSync(selected)}
          onToggleStatus={() => handleToggleStatus(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      <AddIntegrationDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAdd}
      />
    </MainLayout>
  );
}
