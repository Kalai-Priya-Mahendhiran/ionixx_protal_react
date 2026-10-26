import type { OrgPerson } from "@/lib/org-chart";
import { teamMembers as roster, type TeamMember } from "@/lib/team-data";
import { getUserById } from "@/lib/user-directory";

// The org chart person in the shape this page shows; skills come from the roster when known
// Status comes from today's attendance via useOrgPeople, the same source as Attendance Monitoring
const ORG_STATUS: Record<OrgPerson["status"], TeamMember["status"]> = { "in-office": "active", remote: "remote", "on-leave": "on-leave", "not-in": "not-in", invited: "not-in" };
export const toMember = (person: OrgPerson): TeamMember => ({
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

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
