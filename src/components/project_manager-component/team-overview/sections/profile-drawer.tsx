import { Users, Mail, Phone, MapPin, Calendar, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSheet } from "@/components/ui/sheet";
import type { TeamMember } from "@/lib/team-data";
import { TEAM_MEMBER_STATUS_LABELS } from "@/lib/constants";
import { initials } from "./team-overview-meta";

export function ProfileDrawer({ member, onClose }: { member: TeamMember; onClose: () => void }) {
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
