import { useState } from "react";
import { Lock } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionsSettingsSection } from "@/components/employee-component/tasks/sections/permissions-settings";
import { useTaskSettings } from "@/services/apis/settings/use-task-settings";
import { PageTabs } from "@/components/common-component/tabs";
import { DefaultPagesSection } from "./sections";

type Tab = "permissions" | "pages";

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

        <PageTabs
          label="Roles and permissions"
          tabs={[
            { id: "permissions", label: "Permission matrix" },
            { id: "pages", label: "Default pages" },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === "permissions" ? <PermissionsSettingsSection /> : <DefaultPagesSection />}
      </div>
    </MainLayout>
  );
}
