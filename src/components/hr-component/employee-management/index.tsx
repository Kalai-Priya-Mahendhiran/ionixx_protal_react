import { useMemo, useState } from "react";
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
  X,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type EmploymentStatus = "active" | "on-leave" | "inactive";

interface EmployeeDocument {
  name: string;
  type: string;
  uploadedDate: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  employeeId: string;
  reportingManager: string;
  joiningDate: string;
  location: string;
  status: EmploymentStatus;
  employmentType: "Full-time" | "Contract" | "Intern";
  documents: EmployeeDocument[];
}

const seedEmployees: Employee[] = [
  {
    id: "EMP00101",
    name: "Kalai Priya",
    email: "kalai.priya@ionixx.com",
    phone: "+91 98765 11001",
    designation: "Software Developer",
    department: "Engineering",
    employeeId: "EMP00101",
    reportingManager: "Priya Kumar",
    joiningDate: "2023-04-12",
    location: "Chennai, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2023-03-20" },
      { name: "PAN Card.pdf", type: "ID", uploadedDate: "2023-04-12" },
    ],
  },
  {
    id: "EMP00102",
    name: "Arjun Rao",
    email: "arjun.rao@ionixx.com",
    phone: "+91 98765 11002",
    designation: "Senior Software Developer",
    department: "Engineering",
    employeeId: "EMP00102",
    reportingManager: "Priya Kumar",
    joiningDate: "2021-07-05",
    location: "Bengaluru, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2021-06-10" },
      { name: "Aadhaar.pdf", type: "ID", uploadedDate: "2021-07-05" },
    ],
  },
  {
    id: "EMP00103",
    name: "Meera Sundar",
    email: "meera.sundar@ionixx.com",
    phone: "+91 98765 11003",
    designation: "QA Engineer",
    department: "Quality",
    employeeId: "EMP00103",
    reportingManager: "Priya Kumar",
    joiningDate: "2022-11-21",
    location: "Chennai, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2022-10-18" },
    ],
  },
  {
    id: "EMP00104",
    name: "Rohit Deshmukh",
    email: "rohit.deshmukh@ionixx.com",
    phone: "+91 98765 11004",
    designation: "UI/UX Designer",
    department: "Design",
    employeeId: "EMP00104",
    reportingManager: "Priya Kumar",
    joiningDate: "2023-01-09",
    location: "Pune, IN",
    status: "on-leave",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2022-12-15" },
    ],
  },
  {
    id: "EMP00105",
    name: "Divya Menon",
    email: "divya.menon@ionixx.com",
    phone: "+91 98765 11005",
    designation: "DevOps Engineer",
    department: "Infrastructure",
    employeeId: "EMP00105",
    reportingManager: "Priya Kumar",
    joiningDate: "2020-09-14",
    location: "Hyderabad, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2020-08-25" },
      { name: "Background Verification.pdf", type: "BGV", uploadedDate: "2020-09-30" },
    ],
  },
  {
    id: "EMP00106",
    name: "Karthik Subramanian",
    email: "karthik.s@ionixx.com",
    phone: "+91 98765 11006",
    designation: "Junior Developer",
    department: "Engineering",
    employeeId: "EMP00106",
    reportingManager: "Priya Kumar",
    joiningDate: "2024-06-03",
    location: "Chennai, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [],
  },
  {
    id: "EMP00107",
    name: "Sneha Iyer",
    email: "sneha.iyer@ionixx.com",
    phone: "+91 98765 11007",
    designation: "HR Associate",
    department: "Human Resources",
    employeeId: "EMP00107",
    reportingManager: "Anita Rajan",
    joiningDate: "2024-02-19",
    location: "Chennai, IN",
    status: "active",
    employmentType: "Full-time",
    documents: [
      { name: "Offer Letter.pdf", type: "Offer", uploadedDate: "2024-01-30" },
    ],
  },
  {
    id: "EMP00108",
    name: "Vikram Shetty",
    email: "vikram.shetty@ionixx.com",
    phone: "+91 98765 11008",
    designation: "Backend Intern",
    department: "Engineering",
    employeeId: "EMP00108",
    reportingManager: "Arjun Rao",
    joiningDate: "2025-12-02",
    location: "Remote, IN",
    status: "inactive",
    employmentType: "Intern",
    documents: [],
  },
];

const statusBadgeColor: Record<EmploymentStatus, string> = {
  active: "bg-green-100 text-green-800",
  "on-leave": "bg-orange-100 text-orange-800",
  inactive: "bg-gray-200 text-gray-700",
};

const statusLabel: Record<EmploymentStatus, string> = {
  active: "Active",
  "on-leave": "On leave",
  inactive: "Inactive",
};

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = (data: Omit<Employee, "id" | "documents" | "status">) => {
    const newEmp: Employee = {
      ...data,
      id: data.employeeId,
      documents: [],
      status: "active",
    };
    setEmployees((prev) => [newEmp, ...prev]);
    setShowAddModal(false);
    showToast(`${newEmp.name} added to the directory.`);
  };

  const toggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: e.status === "active" ? "inactive" : "active",
            }
          : e
      )
    );
    setSelected((s) =>
      s && s.id === id
        ? {
            ...s,
            status: s.status === "active" ? "inactive" : "active",
          }
        : s
    );
    const target = employees.find((e) => e.id === id);
    if (target) {
      showToast(
        target.status === "active"
          ? `${target.name} marked inactive.`
          : `${target.name} reactivated.`
      );
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <UserCog className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Employee Management</h1>
                <p className="text-white/90 mt-1">
                  {stats.total} employees Â· {stats.active} active Â· {stats.onLeave} on leave
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-[#464EB8] hover:bg-white/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total"
            count={stats.total}
            icon={<Users className="h-6 w-6 text-indigo-600" />}
            tone="bg-indigo-50"
          />
          <SummaryCard
            label="Active"
            count={stats.active}
            icon={<UserCheck className="h-6 w-6 text-green-600" />}
            tone="bg-green-50"
          />
          <SummaryCard
            label="On Leave"
            count={stats.onLeave}
            icon={<Calendar className="h-6 w-6 text-orange-600" />}
            tone="bg-orange-50"
          />
          <SummaryCard
            label="Inactive"
            count={stats.inactive}
            icon={<UserX className="h-6 w-6 text-gray-600" />}
            tone="bg-gray-100"
          />
        </div>

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
                        {formatDate(e.joiningDate)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={statusBadgeColor[e.status]}>
                          {statusLabel[e.status]}
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
          onToggleStatus={() => toggleStatus(selected.id)}
        />
      )}

      {showAddModal && (
        <AddEmployeeModal
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAdd}
          existingDepartments={departments}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm">
          <span>{toast}</span>
        </div>
      )}
    </MainLayout>
  );
}

function SummaryCard({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
        <div className={`p-3 rounded-xl ${tone}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function EmployeeDrawer({
  employee,
  onClose,
  onToggleStatus,
}: {
  employee: Employee;
  onClose: () => void;
  onToggleStatus: () => void;
}) {
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
                {initials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{employee.name}</h2>
              <p className="text-sm text-white/90">{employee.designation}</p>
              <Badge className="mt-2 bg-white/20 text-white border-white/30">
                {statusLabel[employee.status]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
              value={formatDate(employee.joiningDate)}
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
                          {d.type} Â· uploaded {formatDate(d.uploadedDate)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1">
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={onToggleStatus}
            className={
              employee.status === "active"
                ? "flex-1 border-red-300 text-red-600 hover:bg-red-50"
                : "flex-1 border-green-300 text-green-600 hover:bg-green-50"
            }
          >
            {employee.status === "active" ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

function AddEmployeeModal({
  onCancel,
  onSubmit,
  existingDepartments,
}: {
  onCancel: () => void;
  onSubmit: (data: Omit<Employee, "id" | "documents" | "status">) => void;
  existingDepartments: string[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState(existingDepartments[0] ?? "Engineering");
  const [employeeId, setEmployeeId] = useState("");
  const [reportingManager, setReportingManager] = useState("");
  const [joiningDate, setJoiningDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] =
    useState<Employee["employmentType"]>("Full-time");

  const canSubmit =
    name.trim() && email.trim() && employeeId.trim() && designation.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Add New Employee</h2>
            <p className="text-xs text-white/80">Create a new employee record.</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
          <FormField label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Employee ID">
              <input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="HR-assigned ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Joining date">
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
          <FormField label="Designation">
            <input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                {existingDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="Human Resources">Human Resources</option>
                <option value="Sales">Sales</option>
              </select>
            </FormField>
            <FormField label="Type">
              <select
                value={employmentType}
                onChange={(e) =>
                  setEmploymentType(e.target.value as Employee["employmentType"])
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Reporting to">
              <input
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
            <FormField label="Location">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#464EB8]/30"
              />
            </FormField>
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                name,
                email,
                phone,
                designation,
                department,
                employeeId,
                reportingManager,
                joiningDate,
                location,
                employmentType,
              })
            }
            className="bg-[#464EB8] hover:bg-[#3a3f9a]"
          >
            Add employee
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-700 mb-1 block">{label}</span>
      {children}
    </label>
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
