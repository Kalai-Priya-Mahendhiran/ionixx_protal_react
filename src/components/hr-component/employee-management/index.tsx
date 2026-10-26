import { useMemo, useState } from "react";
import {
  UserCog,
  Plus,
  Calendar,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { PageHeader, headerPrimaryButtonClass } from "@/components/ui/page-header";
import type { AddEmployeeInput } from "@/services/apis/employees/employee-service";
import { useAddEmployee, useEmployees, useSetEmployeeActive } from "@/services/apis/employees/use-employees";
import { AddEmployeeDialog, EmployeeDirectorySection, EmployeeDrawer } from "./sections";
import type { Employee, EmploymentStatus } from "./sections/employee-utils";
import { EMPLOYEE_MANAGEMENT_INFO } from "./sections/employee-management-info";

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
          info={EMPLOYEE_MANAGEMENT_INFO}
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

        <EmployeeDirectorySection
          employees={filtered}
          departments={departments}
          search={search}
          onSearchChange={setSearch}
          departmentFilter={departmentFilter}
          onDepartmentFilterChange={setDepartmentFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onView={setSelected}
        />
      </div>

      {selected && (
        <EmployeeDrawer
          employee={selected}
          onClose={() => setSelected(null)}
          onToggleStatus={() => toggleStatus(selected)}
          busy={setActive.isPending}
        />
      )}

      <AddEmployeeDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleAdd}
        pending={addEmployee.isPending}
        existingDepartments={departments}
      />
    </MainLayout>
  );
}
