import { useMemo, useState } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Home,
  CalendarOff,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSheet } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { teamBelow, type OrgPerson } from "@/lib/org-chart";
import { teamMembers as roster, type TeamMember } from "@/lib/team-data";
import { getUserById } from "@/lib/user-directory";
import { useOrgPeople } from "@/services/apis/users/use-org-chart";

// The org chart person in the shape this page shows; skills come from the roster when known
const ORG_STATUS: Record<OrgPerson["status"], TeamMember["status"]> = { "in-office": "active", remote: "remote", "on-leave": "on-leave", invited: "active" };
const toMember = (person: OrgPerson): TeamMember => ({
  id: person.id,
  name: person.name,
  email: person.email,
  designation: person.designation,
  department: person.department,
  employeeId: person.employeeId,
  reportingManager: person.managerId ? (getUserById(person.managerId)?.name ?? "—") : "—",
  joiningDate: person.joiningDate ?? "",
  status: ORG_STATUS[person.status],
  skills: roster.find((member) => member.id === person.id)?.skills ?? [],
  phone: person.phone ?? "",
  location: person.location ?? "",
});
import { TEAM_MEMBER_STATUS_COLORS, TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";

export default function TeamOverview() {
  const { user } = useAuth();
  // Everyone below the signed-in manager, live: new reports, leavers and approved leave show straight away
  const { data: people } = useOrgPeople();
  const teamMembers = useMemo(() => (user ? teamBelow(people, user.id).map(toMember) : []), [people, user]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Set by the stat cards; clicking the active card again goes back to all members
  const [statusFilter, setStatusFilter] = useState<TeamMember["status"] | "all">("all");

  const selectedMember = teamMembers.find((member) => member.id === selectedId) ?? null;

  const toggleStatus = (status: TeamMember["status"]) =>
    setStatusFilter((prev) => (prev === status ? "all" : status));

  const departments = useMemo(() => Array.from(new Set(teamMembers.map((m) => m.department))), [teamMembers]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return teamMembers.filter((m) => {
      const matchesSearch =
        !term ||
        m.name.toLowerCase().includes(term) ||
        m.designation.toLowerCase().includes(term) ||
        m.employeeId.toLowerCase().includes(term);
      const matchesDept = departmentFilter === "all" || m.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [teamMembers, search, departmentFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.status === "active").length;
    const remote = teamMembers.filter((m) => m.status === "remote").length;
    const onLeave = teamMembers.filter((m) => m.status === "on-leave").length;
    return { total, active, remote, onLeave };
  }, [teamMembers]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Users}
          title="Team Overview"
          description={`${stats.total} team members · ${stats.active} in office · ${stats.remote} remote · ${stats.onLeave} on leave`}
        />

        <StatGrid>
          <StatCard icon={Users} label="Total Members" value={stats.total} tone="indigo" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatCard icon={Building} label="In Office" value={stats.active} tone="green" active={statusFilter === "active"} onClick={() => toggleStatus("active")} />
          <StatCard icon={Home} label="Remote" value={stats.remote} tone="blue" active={statusFilter === "remote"} onClick={() => toggleStatus("remote")} />
          <StatCard icon={CalendarOff} label="On Leave" value={stats.onLeave} tone="orange" active={statusFilter === "on-leave"} onClick={() => toggleStatus("on-leave")} />
        </StatGrid>

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
                  onClick={() => setSelectedId(m.id)}
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
        <ProfileDrawer member={selectedMember} onClose={() => setSelectedId(null)} />
      )}
    </MainLayout>
  );
}

function ProfileDrawer({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  return (
    <AppSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={member.name}
      description={member.designation}
      header={
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
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
      }
      footer={
        <>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1 bg-[#464EB8] hover:bg-[#3a3f9a]">View full profile</Button>
        </>
      }
    >
      <div className="space-y-5">
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
    </AppSheet>
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
