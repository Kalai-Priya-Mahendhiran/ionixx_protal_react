import { useMemo, useState } from "react";
import {
  ScrollText,
  Search,
  Download,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Server,
  Database,
  Cpu,
  Cloud,
  Filter,
  X,
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
import { LOG_SEVERITY_STYLES, SERVICE_HEALTH_STYLES, SERVICE_HEALTH_LABELS } from "@/lib/constants";

type Severity = "info" | "warn" | "error" | "success";
type ServiceHealth = "healthy" | "degraded" | "down";

interface LogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  severity: Severity;
  ip: string;
  details?: string;
}

interface ServiceStatus {
  key: string;
  label: string;
  status: ServiceHealth;
  uptime: string;
  latencyMs: number;
  icon: typeof Server;
}

const seedLogs: LogEntry[] = [
  {
    id: "LOG-9001",
    timestamp: "2026-05-08T09:42:11",
    actor: "anita.rajan@ionixx.com",
    action: "user.invite",
    resource: "USR-1014",
    severity: "info",
    ip: "10.4.21.5",
    details: "Invite sent to new hire (Engineering).",
  },
  {
    id: "LOG-9002",
    timestamp: "2026-05-08T09:38:54",
    actor: "system",
    action: "auth.session.expired",
    resource: "USR-1006",
    severity: "info",
    ip: "â€”",
    details: "Session expired after inactivity (30m).",
  },
  {
    id: "LOG-9003",
    timestamp: "2026-05-08T09:21:02",
    actor: "divya.menon@ionixx.com",
    action: "role.permission.update",
    resource: "ROL-003",
    severity: "warn",
    ip: "10.4.18.2",
    details: "Increased payroll access from read â†’ write.",
  },
  {
    id: "LOG-9004",
    timestamp: "2026-05-08T08:54:33",
    actor: "rohit.deshmukh@ionixx.com",
    action: "auth.login.failed",
    resource: "â€”",
    severity: "error",
    ip: "104.28.41.9",
    details: "5 failed login attempts â€” account temporarily locked.",
  },
  {
    id: "LOG-9005",
    timestamp: "2026-05-08T08:30:00",
    actor: "system",
    action: "integration.payroll.sync",
    resource: "INT-PAYROLL",
    severity: "success",
    ip: "â€”",
    details: "Synced 142 employee records to payroll vendor.",
  },
  {
    id: "LOG-9006",
    timestamp: "2026-05-08T08:12:47",
    actor: "priya.kumar@ionixx.com",
    action: "leave.approve",
    resource: "LV-2341",
    severity: "info",
    ip: "10.4.19.7",
  },
  {
    id: "LOG-9007",
    timestamp: "2026-05-08T07:55:14",
    actor: "system",
    action: "backup.snapshot",
    resource: "DB-PRIMARY",
    severity: "success",
    ip: "â€”",
    details: "Nightly snapshot completed in 4m 22s.",
  },
  {
    id: "LOG-9008",
    timestamp: "2026-05-07T23:48:09",
    actor: "system",
    action: "alert.cpu.high",
    resource: "node-api-02",
    severity: "warn",
    ip: "â€”",
    details: "Sustained CPU above 85% for 8m. Auto-scaled out.",
  },
  {
    id: "LOG-9009",
    timestamp: "2026-05-07T22:18:55",
    actor: "sai.krishnan@ionixx.com",
    action: "report.export",
    resource: "RPT-Q1-KPI",
    severity: "info",
    ip: "10.4.20.1",
  },
  {
    id: "LOG-9010",
    timestamp: "2026-05-07T21:02:33",
    actor: "system",
    action: "integration.iam.handshake",
    resource: "INT-IAM",
    severity: "error",
    ip: "â€”",
    details: "OIDC discovery endpoint timed out (3 retries).",
  },
  {
    id: "LOG-9011",
    timestamp: "2026-05-07T18:22:41",
    actor: "divya.menon@ionixx.com",
    action: "system.config.update",
    resource: "CONFIG-WORKFLOWS",
    severity: "warn",
    ip: "10.4.18.2",
    details: "Disabled quarterly performance reminder workflow.",
  },
  {
    id: "LOG-9012",
    timestamp: "2026-05-07T16:09:18",
    actor: "vikram.shetty@ionixx.com",
    action: "auth.login",
    resource: "â€”",
    severity: "success",
    ip: "10.4.22.4",
    details: "First successful sign-in (MFA enrollment complete).",
  },
];

const services: ServiceStatus[] = [
  {
    key: "api",
    label: "API Gateway",
    status: "healthy",
    uptime: "99.98%",
    latencyMs: 142,
    icon: Server,
  },
  {
    key: "db",
    label: "Primary Database",
    status: "healthy",
    uptime: "99.99%",
    latencyMs: 12,
    icon: Database,
  },
  {
    key: "auth",
    label: "Auth Service",
    status: "degraded",
    uptime: "99.42%",
    latencyMs: 318,
    icon: Cpu,
  },
  {
    key: "storage",
    label: "Object Storage",
    status: "healthy",
    uptime: "100.00%",
    latencyMs: 88,
    icon: Cloud,
  },
];

const severityIcon: Record<Severity, React.ReactNode> = {
  info: <Info className="h-3 w-3" />,
  warn: <AlertTriangle className="h-3 w-3" />,
  error: <XCircle className="h-3 w-3" />,
  success: <CheckCircle2 className="h-3 w-3" />,
};

export default function Logs() {
  const [logs] = useState<LogEntry[]>(seedLogs);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const actors = useMemo(() => {
    const set = new Set(logs.map((l) => l.actor));
    return Array.from(set);
  }, [logs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesTerm =
        !term ||
        l.action.toLowerCase().includes(term) ||
        l.resource.toLowerCase().includes(term) ||
        l.actor.toLowerCase().includes(term) ||
        l.id.toLowerCase().includes(term);
      const matchesSeverity =
        severityFilter === "all" || l.severity === severityFilter;
      const matchesActor = actorFilter === "all" || l.actor === actorFilter;
      return matchesTerm && matchesSeverity && matchesActor;
    });
  }, [logs, search, severityFilter, actorFilter]);

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter((l) => l.severity === "error").length;
    const warns = logs.filter((l) => l.severity === "warn").length;
    const last24h = logs.filter((l) => {
      const diff =
        Date.now() - new Date(l.timestamp).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;
    return { total, errors, warns, last24h };
  }, [logs]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const exportLogs = () => {
    showToast(`Exported ${filtered.length} log entries to CSV.`);
  };

  const clearFilters = () => {
    setSearch("");
    setSeverityFilter("all");
    setActorFilter("all");
  };

  const filtersActive =
    !!search || severityFilter !== "all" || actorFilter !== "all";

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ScrollText className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Logs & Monitoring</h1>
                <p className="text-white/90 mt-1">
                  {stats.total} events Â· {stats.last24h} in last 24h Â· FR-29 audit trail
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => showToast("Logs refreshed.")}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={exportLogs}
                className="bg-white text-[#464EB8] hover:bg-white/90"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total events"
            count={stats.total}
            icon={<Activity className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Last 24 hours"
            count={stats.last24h}
            icon={<Activity className="h-6 w-6 text-blue-600" />}
            tone="bg-blue-50"
          />
          <SummaryCard
            label="Warnings"
            count={stats.warns}
            icon={<AlertTriangle className="h-6 w-6 text-amber-600" />}
            tone="bg-amber-50"
          />
          <SummaryCard
            label="Errors"
            count={stats.errors}
            icon={<XCircle className="h-6 w-6 text-red-600" />}
            tone="bg-red-50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#464EB8]" />
              System health
            </CardTitle>
            <CardDescription>
              Live status of core services. Auto-refreshes every 60 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <Icon className="h-4 w-4 text-[#464EB8]" />
                        </div>
                        <p className="font-medium text-gray-900 text-sm">
                          {s.label}
                        </p>
                      </div>
                      <Badge className={SERVICE_HEALTH_STYLES[s.status]}>
                        {SERVICE_HEALTH_LABELS[s.status]}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Uptime</p>
                        <p className="font-semibold text-gray-900">{s.uptime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Latency</p>
                        <p className="font-semibold text-gray-900">
                          {s.latencyMs} ms
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-[#464EB8]" />
              Audit log
            </CardTitle>
            <CardDescription>
              Every privileged action is recorded for compliance review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by action, actor, or resource"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as "all" | Severity)
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All severities</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-56 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All actors</option>
                {actors.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              {filtersActive && (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="py-3 px-2">Timestamp</th>
                    <th className="py-3 px-2">Actor</th>
                    <th className="py-3 px-2">Action</th>
                    <th className="py-3 px-2">Resource</th>
                    <th className="py-3 px-2">Severity</th>
                    <th className="py-3 px-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                        {formatDateTime(l.timestamp)}
                      </td>
                      <td className="py-3 px-2 text-gray-700 truncate max-w-[200px]">
                        {l.actor}
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-gray-900">
                        {l.action}
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-gray-700">
                        {l.resource}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`${LOG_SEVERITY_STYLES[l.severity]} inline-flex items-center gap-1`}
                        >
                          {severityIcon[l.severity]}
                          {l.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(l)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-10 text-center text-sm text-gray-500"
                      >
                        No log entries match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {selected && (
        <LogDrawer entry={selected} onClose={() => setSelected(null)} />
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
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
        <div className={`p-3 rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function LogDrawer({
  entry,
  onClose,
}: {
  entry: LogEntry;
  onClose: () => void;
}) {
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
          <p className="text-xs uppercase tracking-wider text-white/80">
            Log entry
          </p>
          <h2 className="text-xl font-bold font-mono mt-1">{entry.id}</h2>
          <Badge className={`mt-3 ${LOG_SEVERITY_STYLES[entry.severity]}`}>
            {entry.severity.toUpperCase()}
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <DetailRow label="Timestamp" value={formatDateTime(entry.timestamp)} />
          <DetailRow label="Actor" value={entry.actor} />
          <DetailRow label="Action" value={entry.action} mono />
          <DetailRow label="Resource" value={entry.resource} mono />
          <DetailRow label="Source IP" value={entry.ip} mono />
          {entry.details && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">
                Details
              </p>
              <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-3">
                {entry.details}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-gray-900 font-medium ${mono ? "font-mono text-sm" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
