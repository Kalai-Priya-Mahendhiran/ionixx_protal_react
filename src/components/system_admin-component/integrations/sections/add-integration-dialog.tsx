import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField, toOptions } from "@/components/ui/form-fields";
import { INTEGRATION_CATEGORIES } from "@/lib/constants";
import { integrationSchema, type IntegrationFormValues } from "@/lib/form-schemas/system";

const EMPTY_INTEGRATION: IntegrationFormValues = {
  name: "",
  vendor: "",
  category: "ERP",
  endpoint: "",
  apiKey: "",
};

export function AddIntegrationDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IntegrationFormValues) => void;
}) {
  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationSchema),
    defaultValues: EMPTY_INTEGRATION,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_INTEGRATION);
  }, [open, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={onSubmit}
      title="Add integration"
      description="Provide connection details to wire up a new service."
      size="lg"
      submitLabel="Connect"
    >
      <TextField control={form.control} name="name" label="Name" placeholder="e.g. Workday HCM" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField control={form.control} name="vendor" label="Vendor" placeholder="e.g. Workday" required />
        <SelectField control={form.control} name="category" label="Category" options={toOptions(INTEGRATION_CATEGORIES)} />
      </div>
      <TextField
        control={form.control}
        name="endpoint"
        label="Endpoint URL"
        type="url"
        inputMode="url"
        placeholder="https://api.example.com/v1"
        required
      />
      <TextField
        control={form.control}
        name="apiKey"
        label="API key"
        type="password"
        placeholder="sk_..."
        autoComplete="new-password"
        hint="Stored encrypted; only the last 4 characters are visible afterward."
        required
      />
    </FormDialog>
  );
}
