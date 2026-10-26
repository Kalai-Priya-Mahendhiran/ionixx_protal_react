import { useState } from "react";
import { Check, KeyRound, Lock, Mail, Phone, UserCheck, UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/ui/sheet";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";
import { CORE_MODULES, MODULE_CATALOG, RESTRICTED_MODULES, roleHasModule } from "@/lib/modules";
import { cn, formatDateTime, getInitials } from "@/lib/utils";
import { useProjects } from "@/services/apis/tasks/use-tasks";
import { useActivateUser, useResetPassword, useSetModuleAccess, useSetProjectMembership, useSetUserRole } from "@/services/apis/users/use-user-access";
import type { UserAccount } from "@/types";
import { DeactivateDialog } from "./deactivate-dialog";
import { ROLES, STATUS_LABEL, fieldClass } from "./user-management-utils";

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

export function UserDrawerSection({ account, isSelf, onClose }: { account: UserAccount; isSelf: boolean; onClose: () => void }) {
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
