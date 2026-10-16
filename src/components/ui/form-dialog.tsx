import { useId, type ReactNode } from 'react';
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';

/*
 * The one dialog style for the whole app.
 *
 *   AppDialog  – the frame: title, optional description, a body that scrolls inside the dialog, a footer.
 *   FormDialog – AppDialog + a react-hook-form/zod form, "Fields marked * are required", Cancel and Save.
 *
 * Adding a field to a dialog is one line inside <FormDialog>, using the fields in form-fields.tsx:
 *   <TextField control={form.control} name="phone" label="Phone" />
 *   <TextField control={form.control} name="email" label="Work email" type="email" required />
 * `required` adds the red asterisk; the zod schema decides what is actually required.
 */

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASS: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
};

export const primaryButtonClass = 'bg-[#464EB8] text-white hover:bg-[#3a3f9a]';
export const destructiveButtonClass = 'bg-red-600 text-white hover:bg-red-700';

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  size?: DialogSize;
  // While true the dialog can't be closed (e.g. saving)
  busy?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function AppDialog({ open, onOpenChange, title, description, size = 'md', busy = false, footer, children, className }: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className={cn('flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden rounded-xl bg-white p-0', SIZE_CLASS[size], className)}>
        <DialogHeader className="space-y-1 border-b border-gray-100 px-6 pb-4 pt-6 pr-12 text-left">
          <DialogTitle className="text-lg font-semibold text-gray-900">{title}</DialogTitle>
          {/* Radix warns without a description, so an empty one is rendered for screen readers */}
          <DialogDescription className={cn('text-sm text-gray-600', !description && 'sr-only')}>{description ?? title}</DialogDescription>
        </DialogHeader>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
        {footer && <DialogFooter className="gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

interface FormDialogProps<T extends FieldValues> extends Omit<AppDialogProps, 'footer' | 'busy'> {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  submitLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  // Extra buttons on the left of the footer (e.g. Delete when editing)
  secondaryAction?: ReactNode;
  // Hide the "Fields marked * are required" note (for forms with no required fields)
  hideRequiredNote?: boolean;
  submitDisabled?: boolean;
}

export function FormDialog<T extends FieldValues>({
  form,
  onSubmit,
  submitLabel = 'Save',
  pendingLabel = 'Saving…',
  pending = false,
  destructive = false,
  secondaryAction,
  hideRequiredNote = false,
  submitDisabled = false,
  children,
  onOpenChange,
  ...dialog
}: FormDialogProps<T>) {
  const formId = useId();
  return (
    <AppDialog
      {...dialog}
      onOpenChange={onOpenChange}
      busy={pending}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {secondaryAction}
            {!hideRequiredNote && (
              <p className="text-xs text-gray-500">
                Fields marked <span className="text-red-500">*</span> are required
              </p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" form={formId} disabled={pending || submitDisabled} className={destructive ? destructiveButtonClass : primaryButtonClass}>
              {pending ? pendingLabel : submitLabel}
            </Button>
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {children}
        </form>
      </Form>
    </AppDialog>
  );
}
