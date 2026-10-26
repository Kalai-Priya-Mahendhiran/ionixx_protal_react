import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { departmentMetrics } from "./analytics-meta";

export function DepartmentBreakdownSection() {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#464EB8]" />
          <span>Department Breakdown</span>
        </CardTitle>
        <CardDescription>
          Headcount, hiring activity, and budget utilization by team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Headcount</th>
                <th className="py-3 px-2">Hires</th>
                <th className="py-3 px-2">Exits</th>
                <th className="py-3 px-2">Productivity</th>
                <th className="py-3 px-2">Budget Used</th>
              </tr>
            </thead>
            <tbody>
              {departmentMetrics.map((d) => (
                <tr key={d.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: d.color }}
                      />
                      <span className="font-medium text-gray-900">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700 font-semibold">
                    {d.headcount}
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-green-600 font-medium">+{d.hires}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-red-500 font-medium">−{d.exits}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[120px] h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.productivity}%`,
                            background: d.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-10">{d.productivity}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge
                      className={
                        d.budgetUsed > 80
                          ? "bg-red-100 text-red-700"
                          : d.budgetUsed > 70
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }
                    >
                      {d.budgetUsed}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
