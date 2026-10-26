import { CheckCircle2, Clock, FileText, ListChecks, ShieldAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { COMPLIANCE_AUDIT_TYPE_COLORS } from "@/lib/constants";
import { formatDateTime, type AuditLog } from "./compliance-meta";

export function AuditLogSection({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="p-2 bg-gray-100 rounded-lg shrink-0">
            {log.type === "upload" && <Upload className="h-4 w-4 text-blue-600" />}
            {log.type === "update" && (
              <FileText className="h-4 w-4 text-purple-600" />
            )}
            {log.type === "review" && (
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
            )}
            {log.type === "delete" && (
              <ShieldAlert className="h-4 w-4 text-red-600" />
            )}
            {log.type === "assign" && (
              <ListChecks className="h-4 w-4 text-indigo-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{log.actor}</span> {log.action}
              </p>
              <Badge className={COMPLIANCE_AUDIT_TYPE_COLORS[log.type]}>{log.type}</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{log.target}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(log.timestamp)} · {log.id}
            </p>
          </div>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-12">
          No audit entries yet.
        </div>
      )}
    </div>
  );
}
