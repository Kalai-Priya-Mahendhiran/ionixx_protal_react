import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserCog,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Users,
  UserCheck,
  UserX,
  Pencil,
  FileText,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField, toOptions } from "@/components/ui/form-fields";
import { AppSheet } from "@/components/ui/sheet";
import { EMPLOYMENT_STATUS_COLORS, EMPLOYMENT_STATUS_LABELS } from "@/lib/constants";
import { addEmployeeSchema, EMPLOYMENT_TYPES, type AddEmployeeFormValues } from "@/lib/form-schemas/hr";
import { getActiveUsers } from "@/lib/user-directory";
import type { AddEmployeeInput, EmployeeRecord } from "@/services/apis/employees/employee-service";
import { useAddEmployee, useEmployees, useSetEmployeeActive } from "@/services/apis/employees/use-employees";

type Employee = EmployeeRecord;
type EmploymentStatus = Employee["status"];

export default function EmployeeManagement() {
  // The shared directory: people added in User Management show up here, and people added here show up there
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployee = useAddEmployee();
  const setActive = useSetEmployeeActive();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Looked up by id so the open drawer shows the latest record
  const selected = employees.find((employee) => employee.id === selectedId) ?? null;
  const setSelected = (employee: Employee | null) => setSelectedId(employee?.id ?? null);
  const [showAddModal, setShowAddModal] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department))),
    [employees]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesSearch =
        !term ||
        e.name.toLowerCase().includes(term) ||
        e.designation.toLowerCase().includes(term) ||
        e.employeeId.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term);
      const matchesDept =
        departmentFilter === "all" || e.department === departmentFilter;
      const matchesStatus =
        statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "active").length;
    const onLeave = employees.filter((e) => e.status === "on-leave").length;
    const inactive = employees.filter((e) => e.status === "inactive").length;
    return { total, active, onLeave, inactive };
  }, [employees]);

  // Stat cards share the status filter with the "All statuses" select; clicking the active card clears it
  const toggleCard = (status: EmploymentStatus) =>
    setStatusFilter((prev) => (prev === status ? "all" : status));

  const handleAdd = (data: AddEmployeeInput) =>
    addEmployee.mutate(data, { onSuccess: () => setShowAddModal(false) });

  const toggleStatus = (employee: Employee) =>
    setActive.mutate({ userId: employee.id, active: employee.status === "inactive", name: employee.name });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          icon={UserCog}
          title="Employee Management"
          description={`${stats.total} employees · ${stats.active} active · ${stats.onLeave} on leave`}
          actions={
            <>
              <Button onClick={() => setShowAddModal(true)} className={headerPrimaryButtonClass}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </>
          }
        />

        <StatGrid>
          <StatCard icon={Users} label="Total" value={stats.total} tone="indigo" loading={isLoading} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatCard icon={UserCheck} label="Active" value={stats.active} tone="green" active={statusFilter === "active"} onClick={() => toggleCard("active")} />
          <StatCard icon={Calendar} label="On Leave" value={stats.onLeave} tone="orange" active={statusFilter === "on-leave"} onClick={() => toggleCard("on-leave")} />
          <StatCard icon={UserX} label="Inactive" value={stats.inactive} tone="gray" active={statusFilter === "inactive"} onClick={() => toggleCard("inactive")} />
        </StatGrid>

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
      </div>

      {selected && (
        <EmployeeDrawer
          employee={selected}
          onClose={() => setSelected(null)}
          onToggleStatus={() => toggleStatus(selected)}
          busy={setActive.isPending}
        />
      )}

      <AddEmployeeModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAdd}
        pending={addEmployee.isPending}
        existingDepartments={departments}
      />
    </MainLayout>
  );
}

function EmployeeDrawer({
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

const EMPLOYMENT_TYPE_OPTIONS = toOptions(EMPLOYMENT_TYPES);

const emptyEmployee = (department: string): AddEmployeeFormValues => ({
  name: "",
  employeeId: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  email: "",
  phone: "",
  designation: "",
  department,
  employmentType: "Full-time",
  managerId: "",
  location: "",
});

function AddEmployeeModal({
  open,
  onOpenChange,
  onSubmit,
  pending,
  existingDepartments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AddEmployeeInput) => void;
  pending: boolean;
  existingDepartments: string[];
}) {
  const defaultDepartment = existingDepartments[0] ?? "Engineering";
  const departmentOptions = useMemo(() => toOptions(existingDepartments), [existingDepartments]);
  // Anyone active can be a reporting manager
  const managerOptions = [{ value: "", label: "None" }, ...[...getActiveUsers()].sort((a, b) => a.name.localeCompare(b.name)).map((person) => ({ value: person.id, label: `${person.name} · ${person.designation}` }))];

  const form = useForm<AddEmployeeFormValues>({
    resolver: zodResolver(addEmployeeSchema),
    defaultValues: emptyEmployee(defaultDepartment),
  });

  useEffect(() => {
    if (open) form.reset(emptyEmployee(defaultDepartment));
  }, [open, defaultDepartment, form]);

  const save = (values: AddEmployeeFormValues) =>
    onSubmit({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone?.trim() ?? "",
      designation: values.designation.trim(),
      department: values.department,
      employeeId: values.employeeId.trim(),
      managerId: values.managerId || undefined,
      // The directory shows a joining date, so a blank one falls back to today
      joiningDate: values.joiningDate || new Date().toISOString().slice(0, 10),
      location: values.location?.trim() ?? "",
      employmentType: values.employmentType,
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Add New Employee"
      description="They're added to the directory and org chart, and get an invitation to sign in."
      size="lg"
      submitLabel="Add employee"
      pending={pending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          control={form.control}
          name="name"
          label="Full name"
          className="sm:col-span-2"
          required
        />
        <TextField
          control={form.control}
          name="employeeId"
          label="Employee ID"
          placeholder="HR-assigned ID"
          required
        />
        <TextField control={form.control} name="joiningDate" label="Joining date" type="date" />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="off"
          required
        />
        <TextField control={form.control} name="phone" label="Phone" type="tel" />
        <TextField
          control={form.control}
          name="designation"
          label="Designation"
          className="sm:col-span-2"
          required
        />
        <SelectField
          control={form.control}
          name="department"
          label="Department"
          options={departmentOptions}
        />
        <SelectField
          control={form.control}
          name="employmentType"
          label="Type"
          options={EMPLOYMENT_TYPE_OPTIONS}
        />
        <SelectField control={form.control} name="managerId" label="Reporting to" options={managerOptions} placeholder="None" required={false} />
        <TextField control={form.control} name="location" label="Location" />
      </div>
    </FormDialog>
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
