import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Users,
  UserCog,
  Pencil,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppSheet } from "@/components/ui/sheet";
import { EMPLOYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatDate, initials, type Employee } from "./employee-utils";

export function EmployeeDrawer({
  employee,
  onClose,
  onToggleStatus,
  busy,
}: {
  employee: Employee;
  onClose: () => void;
  onToggleStatus: () => void;
  busy: boolean;
}) {
  return (
    <AppSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={employee.name}
      description={employee.designation}
      header={
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white relative">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {initials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{employee.name}</h2>
              <p className="text-sm text-white/90">{employee.designation}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                {EMPLOYMENT_STATUS_LABELS[employee.status]}
                {employee.accountStatus === "invited" && " · invite sent"}
              </Badge>
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" className="flex-1">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={onToggleStatus}
            disabled={busy}
            className={
              employee.status !== "inactive"
                ? "flex-1 border-red-300 text-red-600 hover:bg-red-50"
                : "flex-1 border-green-300 text-green-600 hover:bg-green-50"
            }
          >
            {employee.status !== "inactive" ? "Mark inactive" : "Reactivate"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Section title="Contact">
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={employee.email} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={employee.phone} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={employee.location} />
        </Section>
        <Section title="Employment">
          <DetailRow icon={<Building className="h-4 w-4" />} label="Department" value={employee.department} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Reporting to" value={employee.reportingManager} />
          <DetailRow
            icon={<Calendar className="h-4 w-4" />}
            label="Joined"
            value={employee.joiningDate ? formatDate(employee.joiningDate) : "—"}
          />
          <DetailRow icon={<UserCog className="h-4 w-4" />} label="Type" value={employee.employmentType} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Employee ID" value={employee.employeeId} />
        </Section>
        <Section title="Documents">
          {employee.documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {employee.documents.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between border border-gray-200 rounded-md p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#464EB8]" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500">
                        {d.type} · uploaded {formatDate(d.uploadedDate)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </AppSheet>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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
