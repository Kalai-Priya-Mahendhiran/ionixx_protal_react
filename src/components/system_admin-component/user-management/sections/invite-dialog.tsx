import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField } from "@/components/ui/form-fields";
import { inviteUserSchema, type InviteUserFormValues } from "@/lib/form-schemas/system";
import { ROLE_LABELS } from "@/lib/mock-users";
import { getActiveUsers } from "@/lib/user-directory";
import { useInviteUser } from "@/services/apis/users/use-user-access";
import { ROLES } from "./user-management-utils";

/* ---------- Invite ---------- */

const EMPTY_INVITE: InviteUserFormValues = { name: "", email: "", role: "employee", department: "", designation: "", managerId: "" };
const ROLE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const invite = useInviteUser();
  const form = useForm<InviteUserFormValues>({ resolver: zodResolver(inviteUserSchema), defaultValues: EMPTY_INVITE });
  useEffect(() => {
    if (open) form.reset(EMPTY_INVITE);
  }, [open, form]);
  // Anyone active can lead a team (e.g. a senior developer with a few juniors), so the org chart grows under them
  const managers = [...getActiveUsers()].sort((a, b) => a.name.localeCompare(b.name));
  const managerOptions = [{ value: "", label: "None" }, ...managers.map((person) => ({ value: person.id, label: person.name }))];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={(values) => invite.mutate({ ...values, managerId: values.managerId || undefined }, { onSuccess: () => onOpenChange(false) })}
      title="Invite a user"
      description="They get an email to set a password. The account shows as Invited until they sign in."
      size="lg"
      submitLabel="Send invitation"
      pendingLabel="Sending…"
      pending={invite.isPending}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="name" label="Full name" className="sm:col-span-2" required />
        <TextField control={form.control} name="email" label="Work email" type="email" placeholder="name@company.com" className="sm:col-span-2" required />
        <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
        <SelectField control={form.control} name="managerId" label="Reporting manager" options={managerOptions} placeholder="None" required={false} />
        <TextField control={form.control} name="department" label="Department" placeholder="e.g. Engineering" />
        <TextField control={form.control} name="designation" label="Designation" placeholder="e.g. Software Developer" />
      </div>
    </FormDialog>
  );
}
