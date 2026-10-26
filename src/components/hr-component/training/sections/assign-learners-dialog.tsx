import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { MultiCheckboxField, toOptions } from "@/components/ui/form-fields";
import { assignLearnersSchema, type AssignLearnersFormValues } from "@/lib/form-schemas/hr";
import type { Course } from "./training-meta";

const candidateLearners = toOptions([
  "Kalai Priya",
  "Arjun Rao",
  "Meera Sundar",
  "Rohit Deshmukh",
  "Divya Menon",
  "Karthik Subramanian",
  "Sneha Iyer",
]);

export function AssignLearnersDialog({
  course,
  onCancel,
  onSubmit,
}: {
  course: Course;
  onCancel: () => void;
  onSubmit: (names: string[]) => void;
}) {
  const form = useForm<AssignLearnersFormValues>({
    resolver: zodResolver(assignLearnersSchema),
    defaultValues: { learners: [] },
  });
  const count = form.watch("learners").length;

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && onCancel()}
      form={form}
      onSubmit={(values) => onSubmit(values.learners)}
      title="Assign Learners"
      description={course.title}
      submitLabel={`Assign ${count || ""}`.trim()}
    >
      <MultiCheckboxField
        control={form.control}
        name="learners"
        label="Learners"
        options={candidateLearners}
        required
      />
    </FormDialog>
  );
}
