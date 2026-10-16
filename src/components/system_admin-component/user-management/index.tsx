import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, KeyRound, Lock, Mail, Phone, Plus, Search, UserCheck, UserX, Users2 } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { AppDialog, FormDialog, destructiveButtonClass } from "@/components/ui/form-dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { AppSheet } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { inviteUserSchema, type InviteUserFormValues } from "@/lib/form-schemas/system";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";
import { CORE_MODULES, MODULE_CATALOG, RESTRICTED_MODULES, roleHasModule } from "@/lib/modules";
import { getActiveUsers } from "@/lib/user-directory";
import { cn, formatDateTime, getInitials } from "@/lib/utils";
import { useProjects } from "@/services/apis/tasks/use-tasks";
import {
  useActivateUser,
  useDeactivateUser,
  useInviteUser,
  useOpenWork,
  useResetPassword,
  useSetModuleAccess,
  useSetProjectMembership,
  useSetUserRole,
  useUserAccounts,
} from "@/services/apis/users/use-user-access";
import type { AccountStatus, UserAccount } from "@/types";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

const STATUS_STYLE: Record<AccountStatus, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-amber-100 text-amber-800",
  deactivated: "bg-gray-200 text-gray-700",
};
const STATUS_LABEL: Record<AccountStatus, string> = { active: "Active", invited: "Invited", deactivated: "Deactivated" };

const fieldClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30";
const overrideCount = (account: UserAccount) => account.grantedModules.length + account.revokedModules.length;

export default function UserManagement() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading, isError, refetch } = useUserAccounts();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const stats = {
    total: accounts.length,
    active: accounts.filter((account) => account.status === "active").length,
    invited: accounts.filter((account) => account.status === "invited").length,
    deactivated: accounts.filter((account) => account.status === "deactivated").length,
  };

  const query = search.trim().toLowerCase();
  const filtered = accounts.filter(
    (account) =>
      (roleFilter === "all" || account.role === roleFilter) &&
      (statusFilter === "all" || account.status === statusFilter) &&
      (!query || [account.name, account.email, account.id, account.department].some((text) => text.toLowerCase().includes(query))),
  );
  const selected = accounts.find((account) => account.id === selectedId) ?? null;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Users2}
          title="User Management"
          description="Accounts, roles, page access and project access"
          actions={
            <Button onClick={() => setInviting(true)} className={headerPrimaryButtonClass}>
              <Plus className="h-4 w-4 mr-2" />
              Invite user
            </Button>
          }
        />

        <StatGrid>
          <StatCard label="Total" value={stats.total} icon={Users2} tone="indigo" loading={isLoading} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatCard label="Active" value={stats.active} icon={UserCheck} tone="green" loading={isLoading} active={statusFilter === "active"} onClick={() => setStatusFilter("active")} />
          <StatCard label="Invited" value={stats.invited} icon={Clock} tone="amber" loading={isLoading} active={statusFilter === "invited"} onClick={() => setStatusFilter("invited")} />
          <StatCard label="Deactivated" value={stats.deactivated} icon={UserX} tone="gray" loading={isLoading} active={statusFilter === "deactivated"} onClick={() => setStatusFilter("deactivated")} />
        </StatGrid>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-[#464EB8]" />
              <span>Portal users</span>
            </CardTitle>
            <CardDescription>Deactivated people can't sign in and disappear from every picker; their history stays.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, ID or department" aria-label="Search users" className={cn(fieldClass, "pl-10")} />
              </div>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "all")} aria-label="Role" className={cn(fieldClass, "md:w-48")}>
                <option value="all">All roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AccountStatus | "all")} aria-label="Status" className={cn(fieldClass, "md:w-40")}>
                <option value="all">All statuses</option>
                {(Object.keys(STATUS_LABEL) as AccountStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="h-64 animate-pulse rounded-lg bg-gray-100" aria-busy="true" aria-label="Loading users" />
            ) : isError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                Couldn't load users.{" "}
                <button type="button" onClick={() => refetch()} className="font-medium underline">
                  Try again
                </button>
              </div>
            ) : (
              <div className="ionixx-scrollbar relative overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                      <th className="py-3 px-2">User</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2">Department</th>
                      <th className="py-3 px-2">Last sign-in</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((account) => (
                      <tr key={account.id} className={cn("border-b border-gray-100 hover:bg-gray-50", account.status === "deactivated" && "text-gray-500")}>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarFallback className={cn("text-xs font-semibold text-white", account.status === "deactivated" ? "bg-gray-400" : "bg-gradient-to-br from-indigo-600 to-violet-600")}>
                                {getInitials(account.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {account.name}
                                {account.id === user?.id && <span className="ml-1 text-xs font-normal text-gray-500">(you)</span>}
                              </p>
                              <p className="text-xs text-gray-500">
                                {account.email} · {account.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-gray-700">
                          {ROLE_LABELS[account.role]}
                          {overrideCount(account) > 0 && (
                            <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700" title="Has page access different from their role">
                              Custom access
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-gray-700">{account.department}</td>
                        <td className="py-3 px-2 text-gray-600">{account.lastSignInAt ? formatDateTime(account.lastSignInAt) : account.hasLogin ? "—" : "Never"}</td>
                        <td className="py-3 px-2">
                          <Badge className={STATUS_STYLE[account.status]}>{STATUS_LABEL[account.status]}</Badge>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(account.id)} aria-label={`Manage ${account.name}`}>
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                          No users match your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && <UserDrawer account={selected} isSelf={selected.id === user?.id} onClose={() => setSelectedId(null)} />}
      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </MainLayout>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/* ---------- Side panel ---------- */

function UserDrawer({ account, isSelf, onClose }: { account: UserAccount; isSelf: boolean; onClose: () => void }) {
  const setRole = useSetUserRole();
  const setModule = useSetModuleAccess();
  const setProject = useSetProjectMembership();
  const resetPassword = useResetPassword();
  const activate = useActivateUser();
  const { data: projects = [] } = useProjects();
  const [addProjectId, setAddProjectId] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  const memberOf = projects.filter((project) => project.memberIds.includes(account.id));
  const notMemberOf = projects.filter((project) => !project.memberIds.includes(account.id));
  const groups = [...new Set(MODULE_CATALOG.map((module) => module.group))];
  const inactive = account.status === "deactivated";

  return (
    <>
      <AppSheet
        open
        onOpenChange={(open) => !open && !deactivating && onClose()}
        title={`Manage ${account.name}`}
        description={`${account.designation} · ${account.department}`}
        width="lg"
        header={
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-4 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{getInitials(account.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-xl font-bold">{account.name}</h2>
                <p className="text-sm text-white/90">
                  {account.designation} · {account.department}
                </p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30">{STATUS_LABEL[account.status]}</Badge>
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <Button variant="outline" className="flex-1" disabled={inactive || resetPassword.isPending} onClick={() => resetPassword.mutate(account.id)}>
              <KeyRound className="h-4 w-4 mr-1" />
              Reset password
            </Button>
            {account.status === "active" ? (
              <Button variant="outline" disabled={isSelf} title={isSelf ? "You can't deactivate your own account" : undefined} onClick={() => setDeactivating(true)} className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                <UserX className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
            ) : (
              <Button variant="outline" disabled={activate.isPending} onClick={() => activate.mutate(account.id)} className="flex-1 border-green-300 text-green-700 hover:bg-green-50">
                <UserCheck className="h-4 w-4 mr-1" />
                {account.status === "invited" ? "Activate now" : "Reactivate"}
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-7">
          <Section title="Contact">
            <p className="flex items-center gap-2 text-sm text-gray-800">
              <Mail className="h-4 w-4 text-gray-400" />
              {account.email}
            </p>
            {account.phone && (
              <p className="flex items-center gap-2 text-sm text-gray-800">
                <Phone className="h-4 w-4 text-gray-400" />
                {account.phone}
              </p>
            )}
            {account.invitedAt && account.status === "invited" && <p className="text-xs text-gray-500">Invited {formatDateTime(account.invitedAt)}</p>}
            {account.deactivatedAt && inactive && <p className="text-xs text-gray-500">Deactivated {formatDateTime(account.deactivatedAt)}</p>}
          </Section>

          <Section title="Role" hint="Decides what they can do (Roles & Permissions). Changes apply at their next sign-in.">
            <select
              value={account.role}
              onChange={(event) => setRole.mutate({ userId: account.id, role: event.target.value as UserRole })}
              disabled={setRole.isPending || inactive}
              aria-label="Role"
              className={fieldClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </Section>

          <Section title="Page access" hint="Ticked pages appear in their menu. Differences from the role's defaults are marked.">
            {groups.map((group) => (
              <div key={group}>
                <p className="mb-1 text-xs font-semibold text-gray-700">{group}</p>
                <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {MODULE_CATALOG.filter((module) => module.group === group).map((module) => {
                    const byRole = roleHasModule(account.role, module.path);
                    const core = CORE_MODULES.includes(module.path);
                    const granted = account.grantedModules.includes(module.path);
                    const revoked = account.revokedModules.includes(module.path);
                    const checked = core || (byRole ? !revoked : granted);
                    const locked = core || inactive || (RESTRICTED_MODULES.includes(module.path) && !byRole) || (isSelf && RESTRICTED_MODULES.includes(module.path));
                    return (
                      <li key={module.path}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          disabled={locked || setModule.isPending}
                          onClick={() => setModule.mutate({ userId: account.id, path: module.path, allowed: !checked })}
                          title={core ? "Everyone keeps this page" : RESTRICTED_MODULES.includes(module.path) && !byRole ? "Only the System Admin role has system pages" : undefined}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border-2", checked ? "border-[#464EB8] bg-[#464EB8] text-white" : "border-gray-300 bg-white")}>
                            {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-gray-800">{module.label}</span>
                          {locked && !core && RESTRICTED_MODULES.includes(module.path) && !byRole && <Lock className="h-3 w-3 text-gray-400" aria-hidden="true" />}
                          {granted && <span className="rounded bg-green-100 px-1 text-[10px] font-semibold text-green-800">Added</span>}
                          {revoked && <span className="rounded bg-red-100 px-1 text-[10px] font-semibold text-red-800">Removed</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </Section>

          <Section title="Projects" hint="Project members see and work on that project's tasks, within their role's permissions.">
            {memberOf.length === 0 ? (
              <p className="text-sm text-gray-500">Not on any project.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                {memberOf.map((project) => (
                  <li key={project.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-gray-900">{project.name}</span> <span className="text-xs text-gray-500">{project.key}</span>
                      {project.leadId === account.id && <span className="ml-2 rounded bg-indigo-50 px-1.5 text-[11px] font-semibold text-indigo-700">Lead</span>}
                    </span>
                    {project.leadId !== account.id && (
                      <button
                        type="button"
                        onClick={() => setProject.mutate({ userId: account.id, project, member: false })}
                        disabled={setProject.isPending}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!inactive && notMemberOf.length > 0 && (
              <div className="flex gap-2">
                <select value={addProjectId} onChange={(event) => setAddProjectId(event.target.value)} aria-label="Add to project" className={fieldClass}>
                  <option value="">Add to a project…</option>
                  {notMemberOf.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.key})
                    </option>
                  ))}
                </select>
                <Button
                  disabled={!addProjectId || setProject.isPending}
                  onClick={() => {
                    const project = projects.find((item) => item.id === addProjectId);
                    if (project) setProject.mutate({ userId: account.id, project, member: true }, { onSuccess: () => setAddProjectId("") });
                  }}
                  className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]"
                >
                  Add
                </Button>
              </div>
            )}
          </Section>
        </div>
      </AppSheet>
      {deactivating && <DeactivateDialog account={account} onClose={() => setDeactivating(false)} />}
    </>
  );
}

/* ---------- Deactivate ---------- */

function DeactivateDialog({ account, onClose }: { account: UserAccount; onClose: () => void }) {
  const { data: openWork, isLoading } = useOpenWork(account.id);
  const deactivate = useDeactivateUser();
  const [reassignToId, setReassignToId] = useState("");
  const candidates = useMemo(() => getActiveUsers().filter((person) => person.id !== account.id).sort((a, b) => a.name.localeCompare(b.name)), [account.id]);
  const hasTasks = !!openWork && openWork.tasks > 0;

  return (
    <AppDialog
      open
      onOpenChange={(next) => !next && onClose()}
      busy={deactivate.isPending}
      title={`Deactivate ${account.name}?`}
      description="They won't be able to sign in and won't appear in any picker. Their history stays, and you can reactivate them later."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={deactivate.isPending}>
            Cancel
          </Button>
          <Button
            disabled={isLoading || deactivate.isPending}
            onClick={() => deactivate.mutate({ userId: account.id, reassignToId: reassignToId || undefined }, { onSuccess: onClose })}
            className={destructiveButtonClass}
          >
            {deactivate.isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Open work: <b>{openWork?.tasks ?? 0}</b> {openWork?.tasks === 1 ? "task" : "tasks"}
            {!!openWork?.requests && (
              <>
                , <b>{openWork.requests}</b> Admin {openWork.requests === 1 ? "request" : "requests"} (these go back to the queue)
              </>
            )}
          </p>
          {hasTasks && (
            <label className="block space-y-1">
              <span className="text-gray-700">Hand their open tasks to</span>
              <select value={reassignToId} onChange={(event) => setReassignToId(event.target.value)} className={fieldClass}>
                <option value="">Leave them assigned (reassign later)</option>
                {candidates.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.designation}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </AppDialog>
  );
}

/* ---------- Invite ---------- */

const EMPTY_INVITE: InviteUserFormValues = { name: "", email: "", role: "employee", department: "", designation: "", managerId: "" };
const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const invite = useInviteUser();
  const form = useForm<InviteUserFormValues>({ resolver: zodResolver(inviteUserSchema), defaultValues: EMPTY_INVITE });
  useEffect(() => {
    if (open) form.reset(EMPTY_INVITE);
  }, [open, form]);
  const managers = getActiveUsers().filter((person) => person.role === "project_manager" || person.role === "hr" || person.role === "admin" || person.role === "executive");
  const managerOptions = [{ value: "", label: "None" }, ...managers.map((person) => ({ value: person.id, label: person.name }))];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={(values) => invite.mutate({ ...values, managerId: values.managerId || undefined }, { onSuccess: () => onOpenChange(false) })}
      title="Invite a user"
      description="They get an email to set a password. The account shows as Invited until they sign in."
      size="lg"
      submitLabel="Send invitation"
      pendingLabel="Sending…"
      pending={invite.isPending}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Full name" className="sm:col-span-2" required />
        <TextField control={form.control} name="email" label="Work email" type="email" placeholder="name@ionixx.com" className="sm:col-span-2" required />
        <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
        <SelectField control={form.control} name="managerId" label="Reporting manager" options={managerOptions} placeholder="None" required={false} />
        <TextField control={form.control} name="department" label="Department" placeholder="e.g. Engineering" />
        <TextField control={form.control} name="designation" label="Designation" placeholder="e.g. Software Developer" />
      </div>
    </FormDialog>
  );
}
