import { Cloud, Cpu, Database, ScrollText, Server } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AuditLogSection } from "@/components/employee-component/tasks/settings/audit-log-section";
import { SERVICE_HEALTH_LABELS, SERVICE_HEALTH_STYLES } from "@/lib/constants";

type ServiceHealth = "healthy" | "degraded" | "down";

interface ServiceStatus {
  key: string;
  label: string;
  status: ServiceHealth;
  uptime: string;
  latencyMs: number;
  icon: typeof Server;
}

// Placeholder health figures until GET /api/system/health exists
const services: ServiceStatus[] = [
  { key: "api", label: "API Gateway", status: "healthy", uptime: "99.98%", latencyMs: 142, icon: Server },
  { key: "db", label: "Primary Database", status: "healthy", uptime: "99.99%", latencyMs: 12, icon: Database },
  { key: "auth", label: "Auth Service", status: "degraded", uptime: "99.42%", latencyMs: 318, icon: Cpu },
  { key: "storage", label: "Object Storage", status: "healthy", uptime: "100.00%", latencyMs: 88, icon: Cloud },
];

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

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-[#464EB8]" />
              System health
            </CardTitle>
            <CardDescription>Status of core services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div key={service.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-50">
                          <Icon className="h-4 w-4 text-[#464EB8]" />
                        </div>
                        <p className="font-medium text-gray-900 text-sm">{service.label}</p>
                      </div>
                      <Badge className={SERVICE_HEALTH_STYLES[service.status]}>{SERVICE_HEALTH_LABELS[service.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Uptime</p>
                        <p className="font-semibold text-gray-900">{service.uptime}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Latency</p>
                        <p className="font-semibold text-gray-900">{service.latencyMs} ms</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <AuditLogSection />
      </div>
    </MainLayout>
  );
}
