import { useState } from "react";
import { Clock, Plus, UserCheck, UserX, Users2 } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/mock-users";
import { useUserAccounts } from "@/services/apis/users/use-user-access";
import type { AccountStatus } from "@/types";
import { InviteDialog, UserDrawerSection, UsersTableSection } from "./sections";
import { USER_MANAGEMENT_INFO } from "./sections/user-management-info";

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
          info={USER_MANAGEMENT_INFO}
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

        <UsersTableSection
          accounts={filtered}
          currentUserId={user?.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onManage={setSelectedId}
        />
      </div>

      {selected && <UserDrawerSection account={selected} isSelf={selected.id === user?.id} onClose={() => setSelectedId(null)} />}
      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </MainLayout>
  );
}
