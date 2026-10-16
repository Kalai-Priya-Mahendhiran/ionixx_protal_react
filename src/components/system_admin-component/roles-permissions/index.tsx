import { useState } from "react";
import { Check, Lock, Minus } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionsSettingsSection } from "@/components/employee-component/tasks/settings/permissions-settings";
import { ROLE_LABELS, type UserRole } from "@/lib/mock-users";
import { CORE_MODULES, MODULE_CATALOG, RESTRICTED_MODULES, roleHasModule } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { useTaskSettings } from "@/services/apis/settings/use-task-settings";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];
type Tab = "permissions" | "pages";

// The pages each role gets by default; per-person changes are made in User Management
function DefaultPagesTable() {
  const groups = [...new Set(MODULE_CATALOG.map((module) => module.group))];
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Default pages by role</h2>
          <p className="mt-1 text-sm text-gray-600">
            Which pages appear in each role's menu. Add or remove pages for one person in User Management. System pages stay with the System Admin role.
          </p>
        </div>
        <div className="ionixx-scrollbar relative overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Page</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 text-center">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group} className="divide-y divide-gray-100">
                <tr className="bg-indigo-50/40">
                  <th colSpan={ROLES.length + 1} className="px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    {group}
                  </th>
                </tr>
                {MODULE_CATALOG.filter((module) => module.group === group).map((module) => (
                  <tr key={module.path}>
                    <th scope="row" className="px-3 py-2 text-left font-medium text-gray-900">
                      <span className="inline-flex items-center gap-1.5">
                        {module.label}
                        {RESTRICTED_MODULES.includes(module.path) && <Lock className="h-3 w-3 text-gray-400" aria-label="System Admin role only" />}
                      </span>
                    </th>
                    {ROLES.map((role) => {
                      const has = CORE_MODULES.includes(module.path) || roleHasModule(role, module.path);
                      return (
                        <td key={role} className="px-2 py-2 text-center">
                          {has ? (
                            <Check className="mx-auto h-4 w-4 text-green-600" aria-label="Yes" />
                          ) : (
                            <Minus className="mx-auto h-4 w-4 text-gray-300" aria-label="No" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RolesPermissions() {
  const [tab, setTab] = useState<Tab>("permissions");
  // Subscribing keeps the matrix fresh after a save
  useTaskSettings();

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Lock}
          title="Roles & Permissions"
          description="What each of the six roles can do, and which pages they see"
        />

        <div role="tablist" aria-label="Roles and permissions" className="flex gap-1 border-b border-gray-200">
          {(
            [
              ["permissions", "Permission matrix"],
              ["pages", "Default pages"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium", tab === value ? "border-[#464EB8] text-[#464EB8]" : "border-transparent text-gray-600 hover:text-gray-900")}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "permissions" ? <PermissionsSettingsSection /> : <DefaultPagesTable />}
      </div>
    </MainLayout>
  );
}
