import { useMemo, useState } from "react";
import {
  Plug,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  X,
  KeyRound,
  Database,
  Wallet,
  ShieldCheck,
  Boxes,
  Cloud,
  Mail,
  Zap,
  Trash2,
  ExternalLink,
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
import { INTEGRATION_STATUS_STYLES, INTEGRATION_STATUS_LABELS, INTEGRATION_CATEGORIES } from "@/lib/constants";

type IntegrationStatus = "connected" | "disconnected" | "error";
type Category = "ERP" | "Payroll" | "IAM" | "Storage" | "Communication" | "Analytics";

interface Integration {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  status: IntegrationStatus;
  description: string;
  endpoint: string;
  lastSync: string | null;
  recordsSynced: number;
  apiKey: string;
  webhookUrl?: string;
  icon: typeof Database;
}

const seedIntegrations: Integration[] = [
  {
    id: "INT-001",
    name: "SAP ERP",
    vendor: "SAP",
    category: "ERP",
    status: "connected",
    description: "Master employee and cost-center sync.",
    endpoint: "https://erp.ionixx.com/api/v2",
    lastSync: "2026-05-08T08:30:00",
    recordsSynced: 142,
    apiKey: "sk_erp_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢8f2a",
    webhookUrl: "https://portal.ionixx.com/hooks/erp",
    icon: Database,
  },
  {
    id: "INT-002",
    name: "Payroll Vendor",
    vendor: "ADP",
    category: "Payroll",
    status: "connected",
    description: "Monthly payroll processing and payslips.",
    endpoint: "https://api.adp.com/payroll/v3",
    lastSync: "2026-05-08T08:30:00",
    recordsSynced: 142,
    apiKey: "sk_adp_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢a1c4",
    icon: Wallet,
  },
  {
    id: "INT-003",
    name: "IAM Provider",
    vendor: "Okta",
    category: "IAM",
    status: "error",
    description: "SSO and lifecycle for portal users.",
    endpoint: "https://ionixx.okta.com/oauth2/default",
    lastSync: "2026-05-07T21:02:33",
    recordsSynced: 0,
    apiKey: "sk_okta_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢3d77",
    webhookUrl: "https://portal.ionixx.com/hooks/okta",
    icon: ShieldCheck,
  },
  {
    id: "INT-004",
    name: "Object Storage",
    vendor: "AWS S3",
    category: "Storage",
    status: "connected",
    description: "Document and attachment storage.",
    endpoint: "https://s3.ap-south-1.amazonaws.com",
    lastSync: "2026-05-08T09:15:00",
    recordsSynced: 8421,
    apiKey: "sk_aws_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢c2e9",
    icon: Cloud,
  },
  {
    id: "INT-005",
    name: "Email & SMTP",
    vendor: "SendGrid",
    category: "Communication",
    status: "connected",
    description: "Transactional and bulk email delivery.",
    endpoint: "https://api.sendgrid.com/v3",
    lastSync: "2026-05-08T09:32:11",
    recordsSynced: 3142,
    apiKey: "sk_sg_â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢5b18",
    icon: Mail,
  },
  {
    id: "INT-006",
    name: "BI Warehouse",
    vendor: "Snowflake",
    category: "Analytics",
    status: "disconnected",
    description: "Mirror data for executive analytics.",
    endpoint: "https://ionixx.snowflakecomputing.com",
    lastSync: null,
    recordsSynced: 0,
    apiKey: "",
    icon: Boxes,
  },
];

const statusIcon: Record<IntegrationStatus, React.ReactNode> = {
  connected: <CheckCircle2 className="h-3 w-3" />,
  disconnected: <XCircle className="h-3 w-3" />,
  error: <AlertTriangle className="h-3 w-3" />,
};

export default function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(seedIntegrations);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | IntegrationStatus>("all");
  const [selected, setSelected] = useState<Integration | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

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
    showToast(`${i.name} sync triggered.`);
  };

  const handleToggleStatus = (i: Integration) => {
    const next: IntegrationStatus =
      i.status === "connected" ? "disconnected" : "connected";
    setIntegrations((prev) =>
      prev.map((x) => (x.id === i.id ? { ...x, status: next } : x))
    );
    setSelected((s) => (s && s.id === i.id ? { ...s, status: next } : s));
    showToast(
      next === "connected"
        ? `${i.name} reconnected.`
        : `${i.name} disconnected.`
    );
  };

  const handleAdd = (data: {
    name: string;
    vendor: string;
    category: Category;
    endpoint: string;
    apiKey: string;
  }) => {
    const newInt: Integration = {
      id: `INT-${String(integrations.length + 1).padStart(3, "0")}`,
      ...data,
      apiKey: data.apiKey.replace(/.(?=.{4})/g, "â€¢"),
      status: "connected",
      description: `${data.vendor} integration.`,
      lastSync: null,
      recordsSynced: 0,
      icon: Plug,
    };
    setIntegrations((prev) => [newInt, ...prev]);
    setShowAddModal(false);
    showToast(`${data.name} added.`);
  };

  const handleDelete = (id: string) => {
    const i = integrations.find((x) => x.id === id);
    if (!i) return;
    setIntegrations((prev) => prev.filter((x) => x.id !== id));
    setSelected(null);
    showToast(`${i.name} removed.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Plug className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Integrations</h1>
                <p className="text-white/90 mt-1">
                  {stats.connected}/{stats.total} connected Â·{" "}
                  {stats.syncedRecords.toLocaleString()} records synced
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add integration
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total"
            count={stats.total}
            icon={<Plug className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Connected"
            count={stats.connected}
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
            tone="bg-emerald-50"
          />
          <SummaryCard
            label="Errors"
            count={stats.errors}
            icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
            tone="bg-red-50"
          />
          <SummaryCard
            label="Records synced"
            count={stats.syncedRecords}
            icon={<Zap className="h-6 w-6 text-amber-600" />}
            tone="bg-amber-50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-[#464EB8]" />
              Connected systems
            </CardTitle>
            <CardDescription>
              Manage external services and monitor sync health.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or vendor"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "all" | Category)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All categories</option>
                {INTEGRATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | IntegrationStatus)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All statuses</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Not connected</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((i) => {
                const Icon = i.icon;
                return (
                  <div
                    key={i.id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-[#464EB8]/40 transition-colors flex flex-col"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-lg bg-indigo-50">
                          <Icon className="h-5 w-5 text-[#464EB8]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {i.name}
                          </p>
                          <p className="text-xs text-gray-500">{i.vendor}</p>
                        </div>
                      </div>
                      <Badge
                        className={`${INTEGRATION_STATUS_STYLES[i.status]} inline-flex items-center gap-1 flex-shrink-0`}
                      >
                        {statusIcon[i.status]}
                        {INTEGRATION_STATUS_LABELS[i.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 flex-1">
                      {i.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div>
                        <p className="text-gray-500">Category</p>
                        <p className="font-medium text-gray-900">{i.category}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last sync</p>
                        <p className="font-medium text-gray-900">
                          {i.lastSync ? formatDateTime(i.lastSync) : "Never"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelected(i)}
                      >
                        <Settings className="h-3.5 w-3.5 mr-1" />
                        Configure
                      </Button>
                      {i.status === "connected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSync(i)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="md:col-span-2 lg:col-span-3 py-12 text-center text-sm text-gray-500">
                  No integrations match your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selected && (
        <IntegrationDrawer
          integration={selected}
          onClose={() => setSelected(null)}
          onSync={() => handleSync(selected)}
          onToggleStatus={() => handleToggleStatus(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {showAddModal && (
        <AddIntegrationModal
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl text-sm">
          {toast}
        </div>
      )}
    </MainLayout>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {count.toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function IntegrationDrawer({
  integration,
  onClose,
  onSync,
  onToggleStatus,
  onDelete,
}: {
  integration: Integration;
  onClose: () => void;
  onSync: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const Icon = integration.icon;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{integration.name}</h2>
              <p className="text-sm text-white/90">{integration.vendor}</p>
              <Badge className={`mt-2 ${INTEGRATION_STATUS_STYLES[integration.status]}`}>
                {INTEGRATION_STATUS_LABELS[integration.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <Section title="Overview">
            <p className="text-sm text-gray-700">{integration.description}</p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Stat label="Category" value={integration.category} />
              <Stat
                label="Records synced"
                value={integration.recordsSynced.toLocaleString()}
              />
              <Stat
                label="Last sync"
                value={
                  integration.lastSync
                    ? formatDateTime(integration.lastSync)
                    : "Never"
                }
              />
              <Stat label="ID" value={integration.id} mono />
            </div>
          </Section>
          <Section title="Connection">
            <DetailRow
              icon={<ExternalLink className="h-4 w-4" />}
              label="Endpoint"
              value={integration.endpoint}
              mono
            />
            <DetailRow
              icon={<KeyRound className="h-4 w-4" />}
              label="API key"
              value={integration.apiKey || "Not configured"}
              mono
            />
            {integration.webhookUrl && (
              <DetailRow
                icon={<Zap className="h-4 w-4" />}
                label="Webhook"
                value={integration.webhookUrl}
                mono
              />
            )}
          </Section>
          {integration.status === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
              Last sync failed. Verify credentials and endpoint reachability.
            </div>
          )}
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSync}
            disabled={integration.status !== "connected"}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync now
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onToggleStatus}
          >
            {integration.status === "connected" ? "Disconnect" : "Connect"}
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </aside>
    </div>
  );
}

function AddIntegrationModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (data: {
    name: string;
    vendor: string;
    category: Category;
    endpoint: string;
    apiKey: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState<Category>("ERP");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");

  const canSubmit = name.trim() && vendor.trim() && endpoint.trim() && apiKey.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Add integration</h2>
            <p className="text-xs text-white/80">
              Provide connection details to wire up a new service.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Workday HCM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vendor">
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Workday"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {INTEGRATION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Endpoint URL">
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </Field>
          <Field label="API key">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Stored encrypted; only the last 4 characters are visible afterward.
            </p>
          </Field>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                vendor: vendor.trim(),
                category,
                endpoint: endpoint.trim(),
                apiKey: apiKey.trim(),
              })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p
        className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-gray-900 font-medium break-all ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
      </div>
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
      <span className="text-xs font-medium text-gray-700 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
