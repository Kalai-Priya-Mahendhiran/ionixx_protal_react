import { Search, UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EMPLOYMENT_STATUS_COLORS, EMPLOYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, initials, type Employee } from "./employee-utils";

interface EmployeeDirectorySectionProps {
  employees: Employee[];
  departments: string[];
  search: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onView: (employee: Employee) => void;
}

export function EmployeeDirectorySection({
  employees: filtered,
  departments,
  search,
  onSearchChange: setSearch,
  departmentFilter,
  onDepartmentFilterChange: setDepartmentFilter,
  statusFilter,
  onStatusFilterChange: setStatusFilter,
  onView: setSelected,
}: EmployeeDirectorySectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-[#464EB8]" />
          <span>Employee Directory</span>
        </CardTitle>
        <CardDescription>
          Search, filter, and manage employee records and documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, designation, or email"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-48 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-40 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="on-leave">On leave</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 text-xs uppercase text-gray-500">
                <th className="py-3 px-2">Employee</th>
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Designation</th>
                <th className="py-3 px-2">Joined</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                          {initials(e.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{e.name}</p>
                        <p className="text-xs text-gray-500">{e.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-700">{e.department}</td>
                  <td className="py-3 px-2 text-gray-700">{e.designation}</td>
                  <td className="py-3 px-2 text-gray-600">
                    {e.joiningDate ? formatDate(e.joiningDate) : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={EMPLOYMENT_STATUS_COLORS[e.status]}>
                      {EMPLOYMENT_STATUS_LABELS[e.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(e)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-gray-500"
                  >
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
