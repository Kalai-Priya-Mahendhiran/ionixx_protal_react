import { Search, Users2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";
import { cn, formatDateTime, getInitials } from "@/lib/utils";
import type { AccountStatus, UserAccount } from "@/types";
import { ROLES, STATUS_STYLE, fieldClass, overrideCount } from "./user-management-utils";
import { ACCOUNT_STATUS_LABELS } from "@/lib/constants";

interface UsersTableSectionProps {
  accounts: UserAccount[];
  currentUserId?: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  roleFilter: UserRole | "all";
  onRoleFilterChange: (role: UserRole | "all") => void;
  statusFilter: AccountStatus | "all";
  onStatusFilterChange: (status: AccountStatus | "all") => void;
  onManage: (id: string) => void;
}

export function UsersTableSection({
  accounts,
  currentUserId,
  isLoading,
  isError,
  onRetry,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onManage,
}: UsersTableSectionProps) {
  return (
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
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by name, email, ID or department" aria-label="Search users" className={cn(fieldClass, "pl-10")} />
          </div>
          <select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value as UserRole | "all")} aria-label="Role" className={cn(fieldClass, "md:w-48")}>
            <option value="all">All roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as AccountStatus | "all")} aria-label="Status" className={cn(fieldClass, "md:w-40")}>
            <option value="all">All statuses</option>
            {(Object.keys(ACCOUNT_STATUS_LABELS) as AccountStatus[]).map((status) => (
              <option key={status} value={status}>
                {ACCOUNT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-gray-100" aria-busy="true" aria-label="Loading users" />
        ) : isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Couldn't load users.{" "}
            <button type="button" onClick={() => onRetry()} className="font-medium underline">
              Try again
            </button>
          </div>
        ) : (
          <div className="app-scrollbar relative overflow-x-auto">
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
                {accounts.map((account) => (
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
                            {account.id === currentUserId && <span className="ml-1 text-xs font-normal text-gray-500">(you)</span>}
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
                      <Badge className={STATUS_STYLE[account.status]}>{ACCOUNT_STATUS_LABELS[account.status]}</Badge>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => onManage(account.id)} aria-label={`Manage ${account.name}`}>
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 && (
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
  );
}
