import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { SelectField, TextField, toOptions } from "@/components/ui/form-fields";
import { uploadDocumentSchema, type UploadDocumentFormValues } from "@/lib/form-schemas/hr";
import type { NewComplianceDocument } from "./compliance-meta";

const DOCUMENT_CATEGORIES = toOptions(["Policy", "Certification", "Statutory", "Audit", "Contract"]);

const EMPTY_DOCUMENT: UploadDocumentFormValues = {
  name: "",
  category: "Policy",
  expiryDate: "",
};

export function UploadDocumentDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewComplianceDocument) => void;
}) {
  const form = useForm<UploadDocumentFormValues>({
    resolver: zodResolver(uploadDocumentSchema),
    defaultValues: EMPTY_DOCUMENT,
  });

  useEffect(() => {
    if (open) form.reset(EMPTY_DOCUMENT);
  }, [open, form]);

  const save = (values: UploadDocumentFormValues) =>
    onSubmit({
      name: values.name.trim(),
      category: values.category,
      expiryDate: values.expiryDate || null,
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={save}
      title="Upload Document"
      description="Add a compliance document."
      submitLabel="Upload"
    >
      <TextField
        control={form.control}
        name="name"
        label="Document name"
        placeholder="POSH Policy 2026.pdf"
        required
      />
      <SelectField
        control={form.control}
        name="category"
        label="Category"
        options={DOCUMENT_CATEGORIES}
      />
      <TextField control={form.control} name="expiryDate" label="Expiry date" type="date" />
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
        <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Drop a file or click to browse</p>
        <p className="text-xs text-gray-500 mt-1">PDF, DOCX up to 10 MB</p>
      </div>
    </FormDialog>
  );
}
