import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToggleSwitch } from "./toggle-switch";
import type { ModuleToggle } from "./system-config-meta";

export function ModulesSection({
  grouped,
  onToggle,
}: {
  grouped: Record<string, ModuleToggle[]>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat} className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#464EB8]" />
              <span>{cat}</span>
              <Badge className="bg-indigo-100 text-indigo-700 ml-2">
                {items.filter((m) => m.enabled).length}/{items.length} on
              </Badge>
            </CardTitle>
            <CardDescription>
              Toggle modules to enable or hide them across the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((m) => (
                <div
                  key={m.key}
                  className="flex items-start justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#464EB8]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {m.description}
                    </p>
                  </div>
                  <ToggleSwitch
                    on={m.enabled}
                    onChange={() => onToggle(m.key)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
