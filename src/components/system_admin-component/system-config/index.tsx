import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Settings,
  ToggleRight,
  Workflow,
  Sliders,
  Save,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Mail,
  Globe,
  Building2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { FormDialog } from "@/components/ui/form-dialog";
import { CheckboxField, TextareaField, TextField } from "@/components/ui/form-fields";
import { TIMEZONES, WEEK_DAYS, MONTHS } from "@/lib/constants";
import { workflowRuleSchema, type WorkflowRuleFormValues } from "@/lib/form-schemas/system";

type TabKey = "modules" | "workflows" | "defaults";

interface ModuleToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  category: "Core" | "Operations" | "Insights";
}

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  updatedOn: string;
}

interface DefaultsState {
  organizationName: string;
  primaryDomain: string;
  supportEmail: string;
  defaultTimezone: string;
  workWeekStart: string;
  fiscalYearStart: string;
  sessionTimeout: number;
  passwordExpiry: number;
}

const initialModules: ModuleToggle[] = [
  {
    key: "users",
    label: "User Management",
    description: "Provision and govern portal accounts.",
    enabled: true,
    category: "Core",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    description: "Role-based access control policies.",
    enabled: true,
    category: "Core",
  },
  {
    key: "hr",
    label: "HR Operations",
    description: "Recruitment, onboarding, training.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "payroll",
    label: "Payroll & Compensation",
    description: "Run payroll cycles and manage compensation.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "leave",
    label: "Leave & Attendance",
    description: "Time-off requests and attendance tracking.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "performance",
    label: "Performance Reviews",
    description: "Goals, ratings, 360° feedback cycles.",
    enabled: true,
    category: "Operations",
  },
  {
    key: "analytics",
    label: "Analytics & KPIs",
    description: "Executive dashboards and trend reports.",
    enabled: true,
    category: "Insights",
  },
  {
    key: "logs",
    label: "Logs & Monitoring",
    description: "Audit trail, alerting, system health.",
    enabled: true,
    category: "Insights",
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "External ERP, payroll, IAM connectors.",
    enabled: false,
    category: "Insights",
  },
];

const initialWorkflows: WorkflowRule[] = [
  {
    id: "WFL-001",
    name: "Auto-approve casual leave under 2 days",
    trigger: "Leave request submitted (Casual, ≤ 2 days)",
    action: "Approve automatically and notify reporting manager",
    enabled: true,
    updatedOn: "2026-04-14",
  },
  {
    id: "WFL-002",
    name: "Escalate pending offers after 5 days",
    trigger: "Offer status = Pending for 5+ days",
    action: "Notify HR Manager and Talent Lead",
    enabled: true,
    updatedOn: "2026-03-29",
  },
  {
    id: "WFL-003",
    name: "Onboarding checklist on hire",
    trigger: "New employee record created",
    action: "Assign onboarding tasks and welcome email",
    enabled: true,
    updatedOn: "2026-02-08",
  },
  {
    id: "WFL-004",
    name: "Quarterly performance review reminder",
    trigger: "Quarter end -7 days",
    action: "Notify managers to complete reviews",
    enabled: false,
    updatedOn: "2026-01-22",
  },
  {
    id: "WFL-005",
    name: "Suspend inactive users after 90 days",
    trigger: "User last login > 90 days",
    action: "Move user to suspended status",
    enabled: true,
    updatedOn: "2025-11-30",
  },
];

const initialDefaults: DefaultsState = {
  organizationName: "Knowledge & People Self-Service",
  primaryDomain: "company.com",
  supportEmail: "support@company.com",
  defaultTimezone: "Asia/Kolkata",
  workWeekStart: "Monday",
  fiscalYearStart: "April",
  sessionTimeout: 30,
  passwordExpiry: 90,
};

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
          description={
            <>
              {stats.enabledModules}/{stats.totalModules} modules ·{" "}
              {stats.enabledWorkflows}/{stats.totalWorkflows} workflows enabled
            </>
          }
        />

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={tab === "modules"}
            onClick={() => setTab("modules")}
            icon={<ToggleRight className="h-4 w-4" />}
            label="Modules"
          />
          <TabButton
            active={tab === "workflows"}
            onClick={() => setTab("workflows")}
            icon={<Workflow className="h-4 w-4" />}
            label="Workflow rules"
          />
          <TabButton
            active={tab === "defaults"}
            onClick={() => setTab("defaults")}
            icon={<Sliders className="h-4 w-4" />}
            label="System defaults"
          />
        </div>

        {tab === "modules" && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, items]) => (
              <Card key={cat} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-[#464EB8]" />
                    <span>{cat}</span>
                    <Badge className="bg-indigo-100 text-indigo-700 ml-2">
                      {items.filter((m) => m.enabled).length}/{items.length} on
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Toggle modules to enable or hide them across the portal.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-start justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#464EB8]/40 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{m.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {m.description}
                          </p>
                        </div>
                        <ToggleSwitch
                          on={m.enabled}
                          onChange={() => toggleModule(m.key)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "workflows" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-[#464EB8]" />
                    Workflow rules
                  </CardTitle>
                  <CardDescription>
                    Automate routine actions when triggers fire.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingWorkflow(null);
                    setShowWorkflowModal(true);
                  }}
                  className="bg-[#464EB8] hover:bg-[#3a3f9a]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New rule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflows.map((w) => (
                  <div
                    key={w.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900">{w.name}</p>
                          <Badge
                            className={
                              w.enabled
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-200 text-gray-600"
                            }
                          >
                            {w.enabled ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium text-gray-700">
                            When:
                          </span>{" "}
                          {w.trigger}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-700">
                            Then:
                          </span>{" "}
                          {w.action}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-2">
                          Updated {formatDate(w.updatedOn)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ToggleSwitch
                          on={w.enabled}
                          onChange={() => toggleWorkflow(w.id)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingWorkflow(w);
                            setShowWorkflowModal(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWorkflow(w.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {workflows.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-10">
                    No workflow rules yet — add one to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "defaults" && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-[#464EB8]" />
                    System defaults
                  </CardTitle>
                  <CardDescription>
                    Organization-wide settings applied across the portal.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetDefaults}
                    disabled={!defaultsDirty}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                  <Button
                    onClick={saveDefaults}
                    disabled={!defaultsDirty}
                    className="bg-[#464EB8] hover:bg-[#3a3f9a]"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save changes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FieldGroup title="Organization" icon={<Building2 className="h-4 w-4" />}>
                  <Field label="Organization name">
                    <input
                      value={defaultsDraft.organizationName}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          organizationName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    />
                  </Field>
                  <Field label="Primary domain">
                    <input
                      value={defaultsDraft.primaryDomain}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          primaryDomain: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    />
                  </Field>
                  <Field label="Support email">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={defaultsDraft.supportEmail}
                        onChange={(e) =>
                          setDefaultsDraft({
                            ...defaultsDraft,
                            supportEmail: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                      />
                    </div>
                  </Field>
                </FieldGroup>

                <FieldGroup title="Locale & calendar" icon={<Globe className="h-4 w-4" />}>
                  <Field label="Default timezone">
                    <select
                      value={defaultsDraft.defaultTimezone}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          defaultTimezone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Work week starts">
                    <select
                      value={defaultsDraft.workWeekStart}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          workWeekStart: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    >
                      {WEEK_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Fiscal year starts">
                    <select
                      value={defaultsDraft.fiscalYearStart}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          fiscalYearStart: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </Field>
                </FieldGroup>

                <FieldGroup title="Security" icon={<Clock className="h-4 w-4" />}>
                  <Field label="Session timeout (minutes)">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={defaultsDraft.sessionTimeout}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          sessionTimeout: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    />
                  </Field>
                  <Field label="Password expiry (days)">
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={defaultsDraft.passwordExpiry}
                      onChange={(e) =>
                        setDefaultsDraft({
                          ...defaultsDraft,
                          passwordExpiry: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Set to 0 to disable expiry.
                    </p>
                  </Field>
                </FieldGroup>

                <FieldGroup title="Status" icon={<CheckCircle2 className="h-4 w-4" />}>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="text-gray-500">Org:</span>{" "}
                      <span className="font-medium">{defaults.organizationName}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="text-gray-500">Domain:</span>{" "}
                      <span className="font-medium">{defaults.primaryDomain}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="text-gray-500">Timezone:</span>{" "}
                      <span className="font-medium">{defaults.defaultTimezone}</span>
                    </p>
                    <p className="text-gray-700">
                      <span className="text-gray-500">Session timeout:</span>{" "}
                      <span className="font-medium">{defaults.sessionTimeout} min</span>
                    </p>
                    {defaultsDirty && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                        You have unsaved changes.
                      </p>
                    )}
                  </div>
                </FieldGroup>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WorkflowModal
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[#464EB8] text-white shadow-sm"
          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleSwitch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
        on ? "bg-[#464EB8]" : "bg-gray-300"
      }`}
      aria-pressed={on}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function FieldGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <span className="text-[#464EB8]">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const EMPTY_WORKFLOW: WorkflowRuleFormValues = {
  name: "",
  trigger: "",
  action: "",
  enabled: true,
};

function WorkflowModal({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initial: WorkflowRule | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<WorkflowRule, "id" | "updatedOn">) => void;
}) {
  const form = useForm<WorkflowRuleFormValues>({
    resolver: zodResolver(workflowRuleSchema),
    defaultValues: EMPTY_WORKFLOW,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      initial
        ? {
            name: initial.name,
            trigger: initial.trigger,
            action: initial.action,
            enabled: initial.enabled,
          }
        : EMPTY_WORKFLOW
    );
  }, [open, initial, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={initial ? "Edit workflow" : "New workflow rule"}
      description="Define a trigger and the action to take."
      size="lg"
      submitLabel={initial ? "Save changes" : "Create rule"}
    >
      <TextField control={form.control} name="name" label="Rule name" required />
      <TextareaField control={form.control} name="trigger" label="Trigger (when)" rows={2} required />
      <TextareaField control={form.control} name="action" label="Action (then)" rows={2} required />
      <CheckboxField control={form.control} name="enabled" label="Active immediately" />
    </FormDialog>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
