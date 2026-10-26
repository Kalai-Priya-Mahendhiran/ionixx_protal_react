import { Workflow, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "./toggle-switch";
import { formatDate, type WorkflowRule } from "./system-config-meta";

export function WorkflowsSection({
  workflows,
  onNew,
  onEdit,
  onToggle,
  onDelete,
}: {
  workflows: WorkflowRule[];
  onNew: () => void;
  onEdit: (workflow: WorkflowRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-[#464EB8]" />
              Workflow rules
            </CardTitle>
            <CardDescription>
              Automate routine actions when triggers fire.
            </CardDescription>
          </div>
          <Button
            onClick={onNew}
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflows.map((w) => (
            <div
              key={w.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#464EB8]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">{w.name}</p>
                    <Badge
                      className={
                        w.enabled
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }
                    >
                      {w.enabled ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">
                      When:
                    </span>{" "}
                    {w.trigger}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      Then:
                    </span>{" "}
                    {w.action}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Updated {formatDate(w.updatedOn)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch
                    on={w.enabled}
                    onChange={() => onToggle(w.id)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(w)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(w.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-10">
              No workflow rules yet — add one to get started.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
