import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  X,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teamMembers, type TeamMember } from "@/lib/team-data";
import { TEAM_MEMBER_STATUS_COLORS, TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";

export default function TeamOverview() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(teamMembers.map((m) => m.department))),
    []
  );

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return teamMembers.filter((m) => {
      const matchesSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.designation.toLowerCase().includes(term) ||
        m.employeeId.toLowerCase().includes(term);
      const matchesDept = departmentFilter === "all" || m.department === departmentFilter;
      return matchesSearch && matchesDept;
    });
  }, [search, departmentFilter]);

  const stats = useMemo(() => {
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.status === "active").length;
    const remote = teamMembers.filter((m) => m.status === "remote").length;
    const onLeave = teamMembers.filter((m) => m.status === "on-leave").length;
    return { total, active, remote, onLeave };
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Users className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Team Overview</h1>
              <p className="text-white/90 mt-1">
                {stats.total} team members Â· {stats.active} in office Â· {stats.remote} remote Â· {stats.onLeave} on leave
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Members" value={stats.total} accent="bg-indigo-50 text-indigo-700" />
          <StatCard label="In Office" value={stats.active} accent="bg-green-50 text-green-700" />
          <StatCard label="Remote" value={stats.remote} accent="bg-blue-50 text-blue-700" />
          <StatCard label="On Leave" value={stats.onLeave} accent="bg-orange-50 text-orange-700" />
        </div>

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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, role, or employee ID"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
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
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
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
              {filteredMembers.length === 0 && (
                <div className="col-span-full text-center text-sm text-gray-500 py-10">
                  No team members match your filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedMember && (
        <ProfileDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </MainLayout>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        <span className={`inline-block mt-3 px-2 py-0.5 rounded-full text-xs font-semibold ${accent}`}>
          {label}
        </span>
      </CardContent>
    </Card>
  );
}

function ProfileDrawer({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <aside className="w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {initials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{member.name}</h2>
              <p className="text-sm text-white/90">{member.designation}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                {TEAM_MEMBER_STATUS_LABELS[member.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <Section title="Contact">
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={member.email} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={member.phone} />
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={member.location} />
          </Section>
          <Section title="Employment">
            <DetailRow icon={<Building className="h-4 w-4" />} label="Department" value={member.department} />
            <DetailRow icon={<Users className="h-4 w-4" />} label="Reporting to" value={member.reportingManager} />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Joined"
              value={new Date(member.joiningDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <DetailRow icon={<Users className="h-4 w-4" />} label="Employee ID" value={member.employeeId} />
          </Section>
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {member.skills.map((s) => (
                <Badge key={s} className="bg-indigo-50 text-indigo-700">
                  {s}
                </Badge>
              ))}
            </div>
          </Section>
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 bg-[#464EB8] hover:bg-[#3a3f9a]">View full profile</Button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-400">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
