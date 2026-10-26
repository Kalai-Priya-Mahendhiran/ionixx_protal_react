import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextareaField, TextField, toOptions } from "@/components/ui/form-fields";
import { COURSE_LEVELS, createCourseSchema, type CreateCourseFormValues } from "@/lib/form-schemas/hr";
import type { NewCourse } from "./training-meta";

const COURSE_CATEGORIES = toOptions([
  "Engineering",
  "Compliance",
  "Soft Skills",
  "Security",
  "Design",
  "Leadership",
]);
const COURSE_LEVEL_OPTIONS = toOptions(COURSE_LEVELS);

const EMPTY_COURSE: CreateCourseFormValues = {
  title: "",
  category: "Engineering",
  level: "Beginner",
  instructor: "",
  duration: "",
  modules: "1",
  description: "",
};

export function CreateCourseDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewCourse) => void;
}) {
  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: EMPTY_COURSE,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_COURSE);
  }, [open, form]);

  const save = (values: CreateCourseFormValues) =>
    onSubmit({
      title: values.title.trim(),
      category: values.category,
      instructor: values.instructor.trim(),
      duration: values.duration.trim(),
      level: values.level,
      modules: Number(values.modules),
      description: values.description?.trim() ?? "",
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Create Course"
      description="Author a new training course."
      size="lg"
      submitLabel="Publish course"
    >
      <TextField control={form.control} name="title" label="Course title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          control={form.control}
          name="category"
          label="Category"
          options={COURSE_CATEGORIES}
        />
        <SelectField
          control={form.control}
          name="level"
          label="Level"
          options={COURSE_LEVEL_OPTIONS}
        />
        <TextField control={form.control} name="instructor" label="Instructor" required />
        <TextField
          control={form.control}
          name="duration"
          label="Duration"
          placeholder="2h 30m"
          required
        />
      </div>
      <TextField
        control={form.control}
        name="modules"
        label="Modules"
        type="number"
        inputMode="numeric"
        min={1}
        max={50}
        step={1}
        required
      />
      <TextareaField control={form.control} name="description" label="Description" />
    </FormDialog>
  );
}
