import { ClipboardCheck, MessageSquare, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ATTENDANCE_STATUS_META } from "@/components/common-component/attendance/sections/attendance-meta";
import { AttendanceIcon } from "@/components/common-component/attendance/sections/attendance-status";
import type { AttendanceStatus, TeamAttendanceRow } from "@/services/apis/attendance/attendance-service";
import { FILTER_STATUSES, NEEDS_ATTENTION, initials, type StatusFilter } from "./attendance-monitoring-meta";

const statusMeta = (status: AttendanceStatus) => ({
  label: ATTENDANCE_STATUS_META[status].label,
  badge: ATTENDANCE_STATUS_META[status].badge,
  icon: <AttendanceIcon status={status} />,
});

interface TeamAttendanceSectionProps {
  // Every row for the day, and the rows left after search and filter
  rows: TeamAttendanceRow[];
  filtered: TeamAttendanceRow[];
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  filter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  onOpenNote: (userId: string) => void;
}

export function TeamAttendanceSection({ rows, filtered, isLoading, search, onSearchChange, filter, onFilterChange, onOpenNote }: TeamAttendanceSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-[#464EB8]" />
          <span>Team Attendance</span>
        </CardTitle>
        <CardDescription>Real-time view of today's check-ins.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or employee ID"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as StatusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-56 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All statuses</option>
            {FILTER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ATTENDANCE_STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 tracking-wider border-b border-gray-200">
                <th className="py-3 pr-4">Employee</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Check-in</th>
                <th className="py-3 px-2">Check-out</th>
                <th className="py-3 px-2">Note</th>
                <th className="py-3 pl-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const meta = statusMeta(e.status);
                const note = e.note;
                return (
                  <tr key={e.userId} className="border-b border-gray-100 hover:bg-gray-50/60">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-xs font-semibold">
                            {initials(e.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{e.name}</p>
                          <p className="text-xs text-gray-500">{e.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1.5">
                        {meta.icon}
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-700">{e.checkIn ?? "—"}</td>
                    <td className="py-3 px-2 text-gray-700">{e.checkOut ?? "—"}</td>
                    <td className="py-3 px-2 max-w-[18ch]">
                      {note ? (
                        <span className="text-xs text-gray-600 line-clamp-2" title={note}>
                          {note}
                        </span>
                      ) : e.exception ? (
                        <span className="text-xs text-amber-700">{e.exception}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pl-2 text-right">
                      {NEEDS_ATTENTION.includes(e.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenNote(e.userId)}
                          className="text-[#464EB8] border-[#464EB8]/30"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          {note ? "Edit note" : "Add note"}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">No action needed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                    {rows.length === 0 ? "No one reports to you yet." : "No matching attendance records."}
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
