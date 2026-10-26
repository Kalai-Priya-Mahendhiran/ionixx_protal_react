import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  ToggleRight,
  Workflow,
  Sliders,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { PageTabs } from "@/components/common-component/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { DefaultsSection, ModulesSection, WorkflowDialog, WorkflowsSection } from "./sections";
import {
  initialDefaults,
  initialModules,
  initialWorkflows,
  type DefaultsState,
  type ModuleToggle,
  type TabKey,
  type WorkflowRule,
} from "./sections/system-config-meta";
import { SYSTEM_CONFIG_INFO } from "./sections/system-config-info";

export default function SystemConfig() {
  const [tab, setTab] = useState<TabKey>("modules");
  const [modules, setModules] = useState<ModuleToggle[]>(initialModules);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(initialWorkflows);
  const [defaults, setDefaults] = useState<DefaultsState>(initialDefaults);
  const [defaultsDraft, setDefaultsDraft] = useState<DefaultsState>(initialDefaults);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRule | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  const stats = useMemo(() => {
    const enabledModules = modules.filter((m) => m.enabled).length;
    const enabledWorkflows = workflows.filter((w) => w.enabled).length;
    return {
      enabledModules,
      totalModules: modules.length,
      enabledWorkflows,
      totalWorkflows: workflows.length,
    };
  }, [modules, workflows]);

  const grouped = useMemo(() => {
    const map: Record<string, ModuleToggle[]> = {};
    for (const m of modules) {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    }
    return map;
  }, [modules]);

  const toggleModule = (key: string) => {
    setModules((prev) =>
      prev.map((m) => (m.key === key ? { ...m, enabled: !m.enabled } : m))
    );
    const m = modules.find((x) => x.key === key);
    if (m) toast.success(`${m.label} ${!m.enabled ? "enabled" : "disabled"}.`);
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const saveWorkflow = (data: Omit<WorkflowRule, "id" | "updatedOn">) => {
    const today = new Date().toISOString().slice(0, 10);
    if (editingWorkflow) {
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === editingWorkflow.id ? { ...w, ...data, updatedOn: today } : w
        )
      );
      toast.success(`Workflow "${data.name}" updated.`);
    } else {
      const newRule: WorkflowRule = {
        id: `WFL-${String(workflows.length + 1).padStart(3, "0")}`,
        ...data,
        updatedOn: today,
      };
      setWorkflows((prev) => [newRule, ...prev]);
      toast.success(`Workflow "${data.name}" created.`);
    }
    setShowWorkflowModal(false);
    setEditingWorkflow(null);
  };

  const deleteWorkflow = (id: string) => {
    const w = workflows.find((x) => x.id === id);
    if (!w) return;
    setWorkflows((prev) => prev.filter((x) => x.id !== id));
    toast.success(`Workflow "${w.name}" removed.`);
  };

  const defaultsDirty = useMemo(
    () => JSON.stringify(defaults) !== JSON.stringify(defaultsDraft),
    [defaults, defaultsDraft]
  );

  const saveDefaults = () => {
    setDefaults(defaultsDraft);
    toast.success("System defaults saved.");
  };

  const resetDefaults = () => {
    setDefaultsDraft(defaults);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Settings}
          title="System Configuration"
          info={SYSTEM_CONFIG_INFO}
          description={
            <>
              {stats.enabledModules}/{stats.totalModules} modules ·{" "}
              {stats.enabledWorkflows}/{stats.totalWorkflows} workflows enabled
            </>
          }
        />

        <PageTabs
          label="System configuration"
          tabs={[
            { id: "modules", label: "Modules", icon: ToggleRight },
            { id: "workflows", label: "Workflow rules", icon: Workflow },
            { id: "defaults", label: "System defaults", icon: Sliders },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "modules" && (
          <ModulesSection grouped={grouped} onToggle={toggleModule} />
        )}

        {tab === "workflows" && (
          <WorkflowsSection
            workflows={workflows}
            onNew={() => {
              setEditingWorkflow(null);
              setShowWorkflowModal(true);
            }}
            onEdit={(w) => {
              setEditingWorkflow(w);
              setShowWorkflowModal(true);
            }}
            onToggle={toggleWorkflow}
            onDelete={deleteWorkflow}
          />
        )}

        {tab === "defaults" && (
          <DefaultsSection
            defaults={defaults}
            defaultsDraft={defaultsDraft}
            setDefaultsDraft={setDefaultsDraft}
            defaultsDirty={defaultsDirty}
            onReset={resetDefaults}
            onSave={saveDefaults}
          />
        )}
      </div>

      <WorkflowDialog
        open={showWorkflowModal}
        initial={editingWorkflow}
        onOpenChange={(open) => {
          setShowWorkflowModal(open);
          if (!open) setEditingWorkflow(null);
        }}
        onSubmit={saveWorkflow}
      />
    </MainLayout>
  );
}
