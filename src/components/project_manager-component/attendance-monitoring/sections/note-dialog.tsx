import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare } from "lucide-react";
import { FormDialog } from "@/components/ui/form-dialog";
import { TextareaField } from "@/components/ui/form-fields";
import { resolveNoteSchema, type ResolveNoteFormValues } from "@/lib/form-schemas/system";

export function NoteDialog({
  open,
  employeeName,
  initialNote,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  employeeName: string;
  initialNote: string;
  onOpenChange: (open: boolean) => void;
  onSave: (note: string) => void;
}) {
  const form = useForm<ResolveNoteFormValues>({
    resolver: zodResolver(resolveNoteSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (open) form.reset({ note: initialNote });
  }, [open, initialNote, form]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      onSubmit={(values) => onSave(values.note.trim())}
      title={
        <span className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#464EB8]" />
          Resolve exception
        </span>
      }
      description={`Add a note for ${employeeName}.`}
      submitLabel="Save note"
    >
      <TextareaField
        control={form.control}
        name="note"
        label="Note"
        rows={4}
        placeholder="e.g. Approved late entry — informed via Slack."
        required
      />
    </FormDialog>
  );
}
