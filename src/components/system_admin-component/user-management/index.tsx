import { useMemo, useState } from "react";
import {
  Users2,
  Search,
  Plus,
  Mail,
  Phone,
  Shield,
  X,
  UserCheck,
  UserX,
  Clock,
  KeyRound,
  Pencil,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { USER_STATUS_COLORS, USER_STATUS_LABELS, USER_ROLES } from "@/lib/constants";

type UserStatus = "active" | "pending" | "suspended";

interface PortalUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: UserStatus;
  lastLogin: string | null;
  createdOn: string;
  mfaEnabled: boolean;
}

const seedUsers: PortalUser[] = [
  {
    id: "USR-1001",
    name: "Anita Rajan",
    email: "anita.rajan@ionixx.com",
    phone: "+91 98765 22001",
    role: "HR Manager",
    department: "Human Resources",
    status: "active",
    lastLogin: "2026-05-08T08:42:00",
    createdOn: "2024-01-15",
    mfaEnabled: true,
  },
  {
    id: "USR-1002",
    name: "Priya Kumar",
    email: "priya.kumar@ionixx.com",
    phone: "+91 98765 22002",
    role: "Engineering Lead",
    department: "Engineering",
    status: "active",
    lastLogin: "2026-05-08T09:15:00",
    createdOn: "2023-06-02",
    mfaEnabled: true,
  },
  {
    id: "USR-1003",
    name: "Vikram Shetty",
    email: "vikram.shetty@ionixx.com",
    phone: "+91 98765 22003",
    role: "Employee",
    department: "Engineering",
    status: "pending",
    lastLogin: null,
    createdOn: "2026-04-28",
    mfaEnabled: false,
  },
  {
    id: "USR-1004",
    name: "Divya Menon",
    email: "divya.menon@ionixx.com",
    phone: "+91 98765 22004",
    role: "System Admin",
    department: "Infrastructure",
    status: "active",
    lastLogin: "2026-05-07T18:22:00",
    createdOn: "2022-11-09",
    mfaEnabled: true,
  },
  {
    id: "USR-1005",
    name: "Karthik Subramanian",
    email: "karthik.s@ionixx.com",
    phone: "+91 98765 22005",
    role: "Employee",
    department: "Engineering",
    status: "active",
    lastLogin: "2026-05-06T11:05:00",
    createdOn: "2024-06-03",
    mfaEnabled: false,
  },
  {
    id: "USR-1006",
    name: "Rohit Deshmukh",
    email: "rohit.deshmukh@ionixx.com",
    phone: "+91 98765 22006",
    role: "Designer",
    department: "Design",
    status: "suspended",
    lastLogin: "2026-03-19T14:00:00",
    createdOn: "2023-01-09",
    mfaEnabled: false,
  },
  {
    id: "USR-1007",
    name: "Sneha Iyer",
    email: "sneha.iyer@ionixx.com",
    phone: "+91 98765 22007",
    role: "HR Associate",
    department: "Human Resources",
    status: "active",
    lastLogin: "2026-05-08T07:30:00",
    createdOn: "2024-02-19",
    mfaEnabled: true,
  },
  {
    id: "USR-1008",
    name: "Sai Krishnan",
    email: "sai.krishnan@ionixx.com",
    phone: "+91 98765 22008",
    role: "Executive",
    department: "Leadership",
    status: "active",
    lastLogin: "2026-05-07T22:18:00",
    createdOn: "2021-04-17",
    mfaEnabled: true,
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState<PortalUser[]>(seedUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<PortalUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const pending = users.filter((u) => u.status === "pending").length;
    const suspended = users.filter((u) => u.status === "suspended").length;
    return { total, active, pending, suspended };
  }, [users]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleAdd = (data: Omit<PortalUser, "id" | "lastLogin" | "createdOn" | "status">) => {
    const newUser: PortalUser = {
      ...data,
      id: `USR-${1000 + users.length + 1}`,
      lastLogin: null,
      createdOn: new Date().toISOString().slice(0, 10),
      status: "pending",
    };
    setUsers((prev) => [newUser, ...prev]);
    setShowAddModal(false);
    showToast(`Invite sent to ${newUser.email}`);
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: u.status === "active" ? "suspended" : "active",
            }
          : u
      )
    );
    setSelected((s) =>
      s && s.id === id
        ? { ...s, status: s.status === "active" ? "suspended" : "active" }
        : s
    );
    const target = users.find((u) => u.id === id);
    if (target) {
      showToast(
        target.status === "active"
          ? `${target.name} suspended.`
          : `${target.name} reactivated.`
      );
    }
  };

  const resetPassword = (u: PortalUser) => {
    showToast(`Password reset link sent to ${u.email}`);
  };

  const updateRole = (id: string, role: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setSelected((s) => (s && s.id === id ? { ...s, role } : s));
    showToast(`Role updated to ${role}`);
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Users2 className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-white/90 mt-1">
                  {stats.total} users Â· {stats.active} active Â· {stats.pending} pending
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite user
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total"
            count={stats.total}
            icon={<Users2 className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Active"
            count={stats.active}
            icon={<UserCheck className="h-6 w-6 text-green-600" />}
            tone="bg-green-50"
          />
          <SummaryCard
            label="Pending"
            count={stats.pending}
            icon={<Clock className="h-6 w-6 text-amber-600" />}
            tone="bg-amber-50"
          />
          <SummaryCard
            label="Suspended"
            count={stats.suspended}
            icon={<UserX className="h-6 w-6 text-red-600" />}
            tone="bg-red-50"
          />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-[#464EB8]" />
              <span>Portal Users</span>
            </CardTitle>
            <CardDescription>
              Provision accounts, assign roles, and manage access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or ID"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-48 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All roles</option>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-40 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Role</th>
                    <th className="py-3 px-2">Department</th>
                    <th className="py-3 px-2">Last login</th>
                    <th className="py-3 px-2">MFA</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-700">{u.role}</td>
                      <td className="py-3 px-2 text-gray-700">{u.department}</td>
                      <td className="py-3 px-2 text-gray-600">
                        {u.lastLogin ? formatDateTime(u.lastLogin) : "Never"}
                      </td>
                      <td className="py-3 px-2">
                        {u.mfaEnabled ? (
                          <Badge className="bg-green-100 text-green-700">
                            <Shield className="h-3 w-3 mr-1" />
                            On
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-200 text-gray-700">Off</Badge>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={USER_STATUS_COLORS[u.status]}>
                          {USER_STATUS_LABELS[u.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(u)}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                        No users match your filters.
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
        <UserDrawer
          user={selected}
          onClose={() => setSelected(null)}
          onToggleStatus={() => toggleStatus(selected.id)}
          onResetPassword={() => resetPassword(selected)}
          onUpdateRole={(role) => updateRole(selected.id, role)}
        />
      )}

      {showAddModal && (
        <AddUserModal onCancel={() => setShowAddModal(false)} onSubmit={handleAdd} />
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

function UserDrawer({
  user,
  onClose,
  onToggleStatus,
  onResetPassword,
  onUpdateRole,
}: {
  user: PortalUser;
  onClose: () => void;
  onToggleStatus: () => void;
  onResetPassword: () => void;
  onUpdateRole: (role: string) => void;
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
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-white/90">{user.role}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                {USER_STATUS_LABELS[user.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <Section title="Contact">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={user.email} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user.phone} />
          </Section>
          <Section title="Access">
            <div>
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <select
                value={user.role}
                onChange={(e) => onUpdateRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <DetailRow
              icon={<Shield className="h-4 w-4" />}
              label="MFA"
              value={user.mfaEnabled ? "Enabled" : "Not enabled"}
            />
            <DetailRow
              icon={<Clock className="h-4 w-4" />}
              label="Last login"
              value={user.lastLogin ? formatDateTime(user.lastLogin) : "Never signed in"}
            />
            <DetailRow
              icon={<Pencil className="h-4 w-4" />}
              label="Created"
              value={formatDate(user.createdOn)}
            />
          </Section>
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onResetPassword}>
            <KeyRound className="h-4 w-4 mr-1" />
            Reset password
          </Button>
          <Button
            variant="outline"
            onClick={onToggleStatus}
            className={
              user.status === "active"
                ? "flex-1 border-red-300 text-red-600 hover:bg-red-50"
                : "flex-1 border-green-300 text-green-600 hover:bg-green-50"
            }
          >
            {user.status === "active" ? "Suspend" : "Reactivate"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function AddUserModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (data: Omit<PortalUser, "id" | "lastLogin" | "createdOn" | "status">) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(USER_ROLES[USER_ROLES.length - 1]);
  const [department, setDepartment] = useState("Engineering");
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const canSubmit = name.trim() && email.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Invite user</h2>
            <p className="text-xs text-white/80">Send an account invite via email.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <FormField label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {[
                  "Engineering",
                  "Human Resources",
                  "Design",
                  "Infrastructure",
                  "Quality",
                  "Leadership",
                ].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Require MFA on first login
          </label>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({ name, email, phone, role, department, mfaEnabled })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Send invite
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium truncate">{value}</p>
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
