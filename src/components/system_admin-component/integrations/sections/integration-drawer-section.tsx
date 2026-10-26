import {
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Zap,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/ui/sheet";
import { INTEGRATION_STATUS_STYLES, INTEGRATION_STATUS_LABELS } from "@/lib/constants";
import { formatDateTime, type Integration } from "./integrations-meta";

export function IntegrationDrawerSection({
  integration,
  onClose,
  onSync,
  onToggleStatus,
  onDelete,
}: {
  integration: Integration;
  onClose: () => void;
  onSync: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const Icon = integration.icon;
  return (
    <AppSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={integration.name}
      description={`${integration.vendor} integration`}
      header={
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/20">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{integration.name}</h2>
              <p className="text-sm text-white/90">{integration.vendor}</p>
              <Badge className={`mt-2 ${INTEGRATION_STATUS_STYLES[integration.status]}`}>
                {INTEGRATION_STATUS_LABELS[integration.status]}
              </Badge>
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onSync}
            disabled={integration.status !== "connected"}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync now
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onToggleStatus}
          >
            {integration.status === "connected" ? "Disconnect" : "Connect"}
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="border-red-300 text-red-600 hover:bg-red-50"
            aria-label={`Delete ${integration.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Section title="Overview">
          <p className="text-sm text-gray-700">{integration.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Stat label="Category" value={integration.category} />
            <Stat
              label="Records synced"
              value={integration.recordsSynced.toLocaleString()}
            />
            <Stat
              label="Last sync"
              value={
                integration.lastSync
                  ? formatDateTime(integration.lastSync)
                  : "Never"
              }
            />
            <Stat label="ID" value={integration.id} mono />
          </div>
        </Section>
        <Section title="Connection">
          <DetailRow
            icon={<ExternalLink className="h-4 w-4" />}
            label="Endpoint"
            value={integration.endpoint}
            mono
          />
          <DetailRow
            icon={<KeyRound className="h-4 w-4" />}
            label="API key"
            value={integration.apiKey || "Not configured"}
            mono
          />
          {integration.webhookUrl && (
            <DetailRow
              icon={<Zap className="h-4 w-4" />}
              label="Webhook"
              value={integration.webhookUrl}
              mono
            />
          )}
        </Section>
        {integration.status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-md px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
            Last sync failed. Verify credentials and endpoint reachability.
          </div>
        )}
      </div>
    </AppSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p
        className={`text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-gray-900 font-medium break-all ${mono ? "font-mono text-xs" : ""}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
