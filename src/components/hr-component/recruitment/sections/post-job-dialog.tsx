import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextareaField, TextField, toOptions } from "@/components/ui/form-fields";
import { EMPLOYMENT_TYPES, postJobSchema, type PostJobFormValues } from "@/lib/form-schemas/hr";
import type { NewJobPosting } from "./recruitment-meta";

const JOB_DEPARTMENTS = toOptions([
  "Engineering",
  "Design",
  "Quality",
  "Infrastructure",
  "Human Resources",
  "Sales",
]);
const JOB_TYPES = toOptions(EMPLOYMENT_TYPES);

const EMPTY_JOB: PostJobFormValues = {
  title: "",
  department: "Engineering",
  location: "",
  type: "Full-time",
  experience: "",
  description: "",
};

export function PostJobDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewJobPosting) => void;
}) {
  const form = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: EMPTY_JOB,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_JOB);
  }, [open, form]);

  const save = (values: PostJobFormValues) =>
    onSubmit({
      title: values.title.trim(),
      department: values.department,
      location: values.location.trim(),
      type: values.type,
      experience: values.experience?.trim() ?? "",
      description: values.description.trim(),
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Post a Job"
      description="Create a new job posting."
      size="lg"
      submitLabel="Publish posting"
    >
      <TextField control={form.control} name="title" label="Job title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="department"
          label="Department"
          options={JOB_DEPARTMENTS}
        />
        <SelectField control={form.control} name="type" label="Type" options={JOB_TYPES} />
        <TextField control={form.control} name="location" label="Location" required />
        <TextField
          control={form.control}
          name="experience"
          label="Experience"
          placeholder="3-5 years"
        />
      </div>
      <TextareaField
        control={form.control}
        name="description"
        label="Description"
        rows={4}
        required
      />
    </FormDialog>
  );
}
