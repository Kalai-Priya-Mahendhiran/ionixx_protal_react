import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { COMPLIANCE_EMPLOYEE_STATUS_COLORS, COMPLIANCE_EMPLOYEE_STATUS_LABELS } from "@/lib/constants";
import { initials, type EmployeeCompliance } from "./compliance-meta";

export function EmployeeStatusSection({ records }: { records: EmployeeCompliance[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
            <th className="py-3 px-2">Employee</th>
            <th className="py-3 px-2">Department</th>
            <th className="py-3 px-2">Documents</th>
            <th className="py-3 px-2">Pending</th>
            <th className="py-3 px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const pct = Math.round((r.submitted / r.required) * 100);
            return (
              <tr
                key={r.employeeId}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                        {initials(r.employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">{r.employeeName}</p>
                      <p className="text-xs text-gray-500">{r.employeeId}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-2 text-gray-700">{r.department}</td>
                <td className="py-3 px-2 w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={
                          r.status === "compliant"
                            ? "bg-green-500 h-1.5 rounded-full"
                            : r.status === "partial"
                            ? "bg-amber-500 h-1.5 rounded-full"
                            : "bg-red-500 h-1.5 rounded-full"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {r.submitted}/{r.required}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  {r.pending.length === 0 ? (
                    <span className="text-xs text-green-600">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {r.pending.slice(0, 2).map((item) => (
                        <Badge
                          key={item}
                          className="bg-red-50 text-red-700 border border-red-100"
                        >
                          {item}
                        </Badge>
                      ))}
                      {r.pending.length > 2 && (
                        <Badge className="bg-gray-100 text-gray-600">
                          +{r.pending.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2">
                  <Badge className={COMPLIANCE_EMPLOYEE_STATUS_COLORS[r.status]}>
                    {COMPLIANCE_EMPLOYEE_STATUS_LABELS[r.status]}
                  </Badge>
                </td>
              </tr>
            );
          })}
          {records.length === 0 && (
            <tr>
              <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                No employees match this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
