import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Side panel for details (an employee, a candidate, an integration…), the side-panel twin of AppDialog.
 * Same overlay, Esc / click-outside to close and focus handling as every dialog.
 *
 *   <AppSheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title="…" header={…} footer={…}>
 *     …details…
 *   </AppSheet>
 */

type SheetWidth = 'md' | 'lg' | 'xl' | '5xl';
// '5xl' is for wide content such as a pay history grid or a statement table
const WIDTH: Record<SheetWidth, string> = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '5xl': 'max-w-5xl' };

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Accessible name, and the visible title unless `header` replaces the top section
  title: string;
  description?: string;
  // Custom top section (e.g. the gradient profile header); the close button is added on top
  header?: ReactNode;
  footer?: ReactNode;
  width?: SheetWidth;
  children: ReactNode;
}

export function AppSheet({ open, onOpenChange, title, description, header, footer, width = 'md', children }: AppSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
            WIDTH[width],
          )}
        >
          {header ? (
            <>
              <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">{description ?? title}</DialogPrimitive.Description>
              {header}
            </>
          ) : (
            <div className="border-b border-gray-100 px-6 py-5 pr-12">
              <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className={cn('mt-1 text-sm text-gray-600', !description && 'sr-only')}>{description ?? title}</DialogPrimitive.Description>
            </div>
          )}
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 rounded-md p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40',
              header ? 'bg-white/20 text-white hover:bg-white/30' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="flex gap-2 border-t border-gray-100 p-4">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
