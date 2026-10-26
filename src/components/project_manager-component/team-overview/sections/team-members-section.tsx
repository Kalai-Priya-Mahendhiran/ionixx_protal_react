import { Users, Search, MapPin, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TeamMember } from "@/lib/team-data";
import { TEAM_MEMBER_STATUS_COLORS, TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";
import { initials } from "./team-overview-meta";

interface TeamMembersSectionProps {
  members: TeamMember[];
  departments: string[];
  search: string;
  onSearchChange: (search: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (department: string) => void;
  onSelect: (id: string) => void;
}

export function TeamMembersSection({ members, departments, search, onSearchChange, departmentFilter, onDepartmentFilterChange, onSelect }: TeamMembersSectionProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#464EB8]" />
          <span>Team Members</span>
        </CardTitle>
        <CardDescription>Search and filter to drill into individual profiles.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, role, or employee ID"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm md:w-56 focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
          >
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="text-left border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-[#464EB8]/40 transition-all bg-white"
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-semibold">
                    {initials(m.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.designation}</p>
                    </div>
                    <Badge className={TEAM_MEMBER_STATUS_COLORS[m.status]}>{TEAM_MEMBER_STATUS_LABELS[m.status]}</Badge>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500 gap-2">
                    <Building className="h-3.5 w-3.5" />
                    <span>{m.department}</span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500 gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{m.location}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          {members.length === 0 && (
            <div className="col-span-full text-center text-sm text-gray-500 py-10">
              No team members match your filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
