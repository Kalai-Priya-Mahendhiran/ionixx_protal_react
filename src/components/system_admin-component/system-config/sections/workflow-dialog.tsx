import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { CheckboxField, TextareaField, TextField } from "@/components/ui/form-fields";
import { workflowRuleSchema, type WorkflowRuleFormValues } from "@/lib/form-schemas/system";
import type { WorkflowRule } from "./system-config-meta";

const EMPTY_WORKFLOW: WorkflowRuleFormValues = {
  name: "",
  trigger: "",
  action: "",
  enabled: true,
};

export function WorkflowDialog({
  open,
  initial,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initial: WorkflowRule | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<WorkflowRule, "id" | "updatedOn">) => void;
}) {
  const form = useForm<WorkflowRuleFormValues>({
    resolver: zodResolver(workflowRuleSchema),
    defaultValues: EMPTY_WORKFLOW,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      initial
        ? {
            name: initial.name,
            trigger: initial.trigger,
            action: initial.action,
            enabled: initial.enabled,
          }
        : EMPTY_WORKFLOW
    );
  }, [open, initial, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title={initial ? "Edit workflow" : "New workflow rule"}
      description="Define a trigger and the action to take."
      size="lg"
      submitLabel={initial ? "Save changes" : "Create rule"}
    >
      <TextField control={form.control} name="name" label="Rule name" required />
      <TextareaField control={form.control} name="trigger" label="Trigger (when)" rows={2} required />
      <TextareaField control={form.control} name="action" label="Action (then)" rows={2} required />
      <CheckboxField control={form.control} name="enabled" label="Active immediately" />
    </FormDialog>
  );
}
