import {
  Plug,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INTEGRATION_CATEGORIES, INTEGRATION_STATUS_LABELS, INTEGRATION_STATUS_STYLES } from "@/lib/constants";
import { formatDateTime, type Category, type Integration, type IntegrationStatus } from "./integrations-meta";

const statusIcon: Record<IntegrationStatus, React.ReactNode> = {
  connected: <CheckCircle2 className="h-3 w-3" />,
  disconnected: <XCircle className="h-3 w-3" />,
  error: <AlertTriangle className="h-3 w-3" />,
};

interface IntegrationsGridSectionProps {
  integrations: Integration[];
  search: string;
  onSearchChange: (search: string) => void;
  categoryFilter: "all" | Category;
  onCategoryFilterChange: (category: "all" | Category) => void;
  statusFilter: "all" | IntegrationStatus;
  onStatusFilterChange: (status: "all" | IntegrationStatus) => void;
  onConfigure: (integration: Integration) => void;
  onSync: (integration: Integration) => void;
}

export function IntegrationsGridSection({
  integrations,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  onConfigure,
  onSync,
}: IntegrationsGridSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-[#464EB8]" />
          Connected systems
        </CardTitle>
        <CardDescription>
          Manage external services and monitor sync health.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or vendor"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) =>
              onCategoryFilterChange(e.target.value as "all" | Category)
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All categories</option>
            {INTEGRATION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as "all" | IntegrationStatus)
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-44 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All statuses</option>
            {Object.entries(INTEGRATION_STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((i) => {
            const Icon = i.icon;
            return (
              <div
                key={i.id}
                className="border border-gray-200 rounded-lg p-5 hover:border-[#464EB8]/40 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-indigo-50">
                      <Icon className="h-5 w-5 text-[#464EB8]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {i.name}
                      </p>
                      <p className="text-xs text-gray-500">{i.vendor}</p>
                    </div>
                  </div>
                  <Badge
                    className={`${INTEGRATION_STATUS_STYLES[i.status]} inline-flex items-center gap-1 flex-shrink-0`}
                  >
                    {statusIcon[i.status]}
                    {INTEGRATION_STATUS_LABELS[i.status]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  {i.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">{i.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last sync</p>
                    <p className="font-medium text-gray-900">
                      {i.lastSync ? formatDateTime(i.lastSync) : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onConfigure(i)}
                  >
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    Configure
                  </Button>
                  {i.status === "connected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSync(i)}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {integrations.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 py-12 text-center text-sm text-gray-500">
              No integrations match your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
