import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField, toOptions } from "@/components/ui/form-fields";
import { addEmployeeSchema, EMPLOYMENT_TYPES, type AddEmployeeFormValues } from "@/lib/form-schemas/hr";
import { getActiveUsers } from "@/lib/user-directory";
import type { AddEmployeeInput } from "@/services/apis/employees/employee-service";

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

export function AddEmployeeDialog({
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
