import { ScrollText } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { PageHeader } from "@/components/ui/page-header";
import { AuditLogSection } from "@/components/employee-component/tasks/sections/audit-log-section";
import { SystemHealthSection } from "./sections";

// The audit trail (who changed what and when) is the same log as Task Settings → Audit log
export default function Logs() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={ScrollText}
          title="Logs & Monitoring"
          description="Audit trail of every change, and the health of core services"
        />

        <SystemHealthSection />

        <AuditLogSection />
      </div>
    </MainLayout>
  );
}
