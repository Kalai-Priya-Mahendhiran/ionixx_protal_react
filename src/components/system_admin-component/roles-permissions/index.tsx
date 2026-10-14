import { useMemo, useState } from "react";
import {
  Lock,
  Search,
  Plus,
  Shield,
  X,
  Check,
  Users,
  Pencil,
  Copy,
  Trash2,
  ChevronRight,
  KeyRound,
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
import { PERMISSION_MODULES, PERMISSION_LEVEL_STYLES, PERMISSION_LEVEL_LABELS, PERMISSION_LEVELS } from "@/lib/constants";

type PermissionLevel = "none" | "read" | "write" | "admin";

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isSystem: boolean;
  permissions: Record<string, PermissionLevel>;
  updatedOn: string;
}

const seedRoles: Role[] = [
  {
    id: "ROL-001",
    name: "System Admin",
    description: "Full access to all modules and configuration.",
    userCount: 2,
    isSystem: true,
    updatedOn: "2024-01-10",
    permissions: Object.fromEntries(
      PERMISSION_MODULES.map((m) => [m.key, "admin"])
    ) as Record<string, PermissionLevel>,
  },
  {
    id: "ROL-002",
    name: "HR Manager",
    description: "Manages HR operations end-to-end.",
    userCount: 4,
    isSystem: true,
    updatedOn: "2026-03-22",
    permissions: {
      users: "read",
      roles: "none",
      hr: "admin",
      payroll: "write",
      leave: "admin",
      performance: "write",
      analytics: "read",
      system: "none",
      logs: "read",
      integrations: "none",
    },
  },
  {
    id: "ROL-003",
    name: "HR Associate",
    description: "Day-to-day HR support, limited approvals.",
    userCount: 6,
    isSystem: false,
    updatedOn: "2026-04-15",
    permissions: {
      users: "read",
      roles: "none",
      hr: "write",
      payroll: "read",
      leave: "write",
      performance: "read",
      analytics: "none",
      system: "none",
      logs: "none",
      integrations: "none",
    },
  },
  {
    id: "ROL-004",
    name: "Engineering Lead",
    description: "Team oversight, performance and attendance.",
    userCount: 8,
    isSystem: false,
    updatedOn: "2026-04-02",
    permissions: {
      users: "read",
      roles: "none",
      hr: "read",
      payroll: "none",
      leave: "write",
      performance: "write",
      analytics: "read",
      system: "none",
      logs: "none",
      integrations: "none",
    },
  },
  {
    id: "ROL-005",
    name: "Executive",
    description: "Read-only analytics and KPI dashboards.",
    userCount: 3,
    isSystem: true,
    updatedOn: "2025-12-01",
    permissions: {
      users: "read",
      roles: "none",
      hr: "read",
      payroll: "read",
      leave: "read",
      performance: "read",
      analytics: "admin",
      system: "none",
      logs: "read",
      integrations: "none",
    },
  },
  {
    id: "ROL-006",
    name: "Employee",
    description: "Self-service access to personal data and tasks.",
    userCount: 142,
    isSystem: true,
    updatedOn: "2024-06-18",
    permissions: {
      users: "none",
      roles: "none",
      hr: "none",
      payroll: "read",
      leave: "write",
      performance: "read",
      analytics: "none",
      system: "none",
      logs: "none",
      integrations: "none",
    },
  },
];

export default function RolesPermissions() {
  const [roles, setRoles] = useState<Role[]>(seedRoles);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(seedRoles[0].id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
    );
  }, [roles, search]);

  const selected = roles.find((r) => r.id === selectedId) ?? roles[0];

  const stats = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((r) => r.isSystem).length;
    const custom = total - system;
    const totalUsers = roles.reduce((acc, r) => acc + r.userCount, 0);
    return { total, system, custom, totalUsers };
  }, [roles]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const updatePermission = (
    roleId: string,
    moduleKey: string,
    level: PermissionLevel
  ) => {
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? {
              ...r,
              permissions: { ...r.permissions, [moduleKey]: level },
              updatedOn: new Date().toISOString().slice(0, 10),
            }
          : r
      )
    );
  };

  const handleAdd = (data: { name: string; description: string }) => {
    const newRole: Role = {
      id: `ROL-${String(roles.length + 1).padStart(3, "0")}`,
      name: data.name,
      description: data.description,
      userCount: 0,
      isSystem: false,
      updatedOn: new Date().toISOString().slice(0, 10),
      permissions: Object.fromEntries(
        PERMISSION_MODULES.map((m) => [m.key, "none"])
      ) as Record<string, PermissionLevel>,
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedId(newRole.id);
    setShowAddModal(false);
    showToast(`Role "${data.name}" created.`);
  };

  const cloneRole = (r: Role) => {
    const clone: Role = {
      ...r,
      id: `ROL-${String(roles.length + 1).padStart(3, "0")}`,
      name: `${r.name} (copy)`,
      isSystem: false,
      userCount: 0,
      updatedOn: new Date().toISOString().slice(0, 10),
      permissions: { ...r.permissions },
    };
    setRoles((prev) => [...prev, clone]);
    setSelectedId(clone.id);
    showToast(`Cloned to "${clone.name}".`);
  };

  const deleteRole = (id: string) => {
    const r = roles.find((x) => x.id === id);
    if (!r || r.isSystem) return;
    setRoles((prev) => prev.filter((x) => x.id !== id));
    setSelectedId((curr) => (curr === id ? roles[0].id : curr));
    showToast(`Role "${r.name}" deleted.`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Lock className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Roles & Permissions</h1>
                <p className="text-white/90 mt-1">
                  {stats.total} roles Â· {stats.totalUsers} users assigned
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total roles"
            count={stats.total}
            icon={<Shield className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="System roles"
            count={stats.system}
            icon={<KeyRound className="h-6 w-6 text-violet-600" />}
            tone="bg-violet-50"
          />
          <SummaryCard
            label="Custom roles"
            count={stats.custom}
            icon={<Pencil className="h-6 w-6 text-emerald-600" />}
            tone="bg-emerald-50"
          />
          <SummaryCard
            label="Users assigned"
            count={stats.totalUsers}
            icon={<Users className="h-6 w-6 text-amber-600" />}
            tone="bg-amber-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-4 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#464EB8]" />
                Roles
              </CardTitle>
              <CardDescription>Select a role to edit its permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search roles"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {filtered.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      r.id === selectedId
                        ? "border-[#464EB8] bg-indigo-50/60"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{r.name}</p>
                          {r.isSystem && (
                            <Badge className="bg-violet-100 text-violet-700 text-[10px]">
                              System
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {r.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {r.userCount} user{r.userCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 mt-1 flex-shrink-0 ${
                          r.id === selectedId ? "text-[#464EB8]" : "text-gray-300"
                        }`}
                      />
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No roles match your search.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-8 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-[#464EB8]" />
                    {selected.name}
                    {selected.isSystem && (
                      <Badge className="bg-violet-100 text-violet-700">System</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {selected.description}
                  </CardDescription>
                  <p className="text-xs text-gray-400 mt-2">
                    Last updated {formatDate(selected.updatedOn)} Â·{" "}
                    {selected.userCount} user{selected.userCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cloneRole(selected)}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Clone
                  </Button>
                  {!selected.isSystem && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteRole(selected.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th className="py-3 px-2">Module</th>
                      <th className="py-3 px-2">Access level</th>
                      <th className="py-3 px-2 text-right">Permission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((m) => {
                      const level = selected.permissions[m.key] ?? "none";
                      return (
                        <tr key={m.key} className="border-b border-gray-100">
                          <td className="py-3 px-2 align-top">
                            <p className="font-medium text-gray-900">{m.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {m.description}
                            </p>
                          </td>
                          <td className="py-3 px-2 align-top">
                            <Badge className={PERMISSION_LEVEL_STYLES[level]}>
                              {level === "admin" && (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              {PERMISSION_LEVEL_LABELS[level]}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right align-top">
                            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                              {PERMISSION_LEVELS.map((lv) => (
                                <button
                                  key={lv}
                                  disabled={selected.isSystem}
                                  onClick={() =>
                                    updatePermission(selected.id, m.key, lv)
                                  }
                                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                                    level === lv
                                      ? "bg-[#464EB8] text-white"
                                      : "bg-white text-gray-600 hover:bg-gray-50"
                                  } ${selected.isSystem ? "opacity-60 cursor-not-allowed" : ""}`}
                                >
                                  {PERMISSION_LEVEL_LABELS[lv]}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {selected.isSystem && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-4">
                  System roles cannot be edited. Clone this role to create a custom variant.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAddModal && (
        <AddRoleModal
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
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
        <div className={`p-3 rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function AddRoleModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const canSubmit = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">New role</h2>
            <p className="text-xs text-white/80">
              Start from scratch â€” set permissions next.
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
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-700 mb-1 block">
              Role name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Recruiter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-700 mb-1 block">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What can this role do?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </label>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit({ name: name.trim(), description: description.trim() })}
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Create role
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
