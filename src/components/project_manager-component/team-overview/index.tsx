import { useMemo, useState } from "react";
import {
  Users,
  Building,
  Home,
  CalendarOff,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/context/auth-context";
import { teamBelow } from "@/lib/org-chart";
import type { TeamMember } from "@/lib/team-data";
import { useOrgPeople } from "@/services/apis/users/use-org-chart";
import { ProfileDrawer, TeamMembersSection } from "./sections";
import { toMember } from "./sections/team-overview-meta";
import { TEAM_OVERVIEW_INFO } from "./sections/team-overview-info";

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
    const notIn = teamMembers.filter((m) => m.status === "not-in").length;
    return { total, active, remote, onLeave, notIn };
  }, [teamMembers]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={Users}
          title="Team Overview"
          info={TEAM_OVERVIEW_INFO}
          description={`${stats.total} team members · ${stats.active} in office · ${stats.remote} remote · ${stats.onLeave} on leave · ${stats.notIn} not checked in`}
        />

        <StatGrid>
          <StatCard icon={Users} label="Total Members" value={stats.total} tone="indigo" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatCard icon={Building} label="In Office" value={stats.active} tone="green" active={statusFilter === "active"} onClick={() => toggleStatus("active")} />
          <StatCard icon={Home} label="Remote" value={stats.remote} tone="blue" active={statusFilter === "remote"} onClick={() => toggleStatus("remote")} />
          <StatCard icon={CalendarOff} label="On Leave" value={stats.onLeave} tone="orange" active={statusFilter === "on-leave"} onClick={() => toggleStatus("on-leave")} />
        </StatGrid>

        <TeamMembersSection
          members={filteredMembers}
          departments={departments}
          search={search}
          onSearchChange={setSearch}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          onSelect={setSelectedId}
        />
      </div>

      {selectedMember && (
        <ProfileDrawer member={selectedMember} onClose={() => setSelectedId(null)} />
      )}
    </MainLayout>
  );
}
