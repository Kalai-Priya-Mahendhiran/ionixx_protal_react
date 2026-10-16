import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AppDialog, destructiveButtonClass, primaryButtonClass } from '@/components/ui/form-dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

// "Are you sure?" in the shared dialog style
export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', destructive = false, loading = false, onConfirm, onOpenChange }: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      busy={loading}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading} className={destructive ? destructiveButtonClass : primaryButtonClass}>
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </>
      }
    />
  );
}
