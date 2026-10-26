import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { alerts } from "./kpi-meta";
import { formatDate } from "./kpi-utils";

export function ActiveAlertsSection() {
  return (
    <Card className="border-0 shadow-lg lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <span>Active Alerts</span>
        </CardTitle>
        <CardDescription>KPIs requiring attention this period</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span
                className={`mt-0.5 p-1.5 rounded-md ${
                  alert.severity === "high"
                    ? "bg-red-100 text-red-600"
                    : alert.severity === "medium"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm text-gray-900">{alert.kpiName}</p>
                  <Badge
                    className={
                      alert.severity === "high"
                        ? "bg-red-100 text-red-700 text-[10px] py-0"
                        : alert.severity === "medium"
                        ? "bg-amber-100 text-amber-700 text-[10px] py-0"
                        : "bg-blue-100 text-blue-700 text-[10px] py-0"
                    }
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(alert.raisedAt)}</p>
              </div>
              <button className="text-[#464EB8] text-xs font-medium hover:underline flex items-center gap-0.5 flex-shrink-0">
                View <ChevronRight className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
