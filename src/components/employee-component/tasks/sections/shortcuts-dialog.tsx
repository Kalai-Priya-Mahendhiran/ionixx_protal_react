import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ShortcutHelp {
  keys: string;
  label: string;
}

export function Kbd({ children }: { children: string }) {
  return <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-700 shadow-sm">{children}</kbd>;
}

// Lists the shortcuts available on the current page (opened with "?")
export function ShortcutsDialog({ open, onOpenChange, shortcuts }: { open: boolean; onOpenChange: (open: boolean) => void; shortcuts: ShortcutHelp[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>They work anywhere on this page except while typing in a field.</DialogDescription>
        </DialogHeader>
        <ul className="divide-y divide-gray-100">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.keys} className="flex items-center justify-between py-2 text-sm text-gray-700">
              {shortcut.label}
              <Kbd>{shortcut.keys}</Kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
