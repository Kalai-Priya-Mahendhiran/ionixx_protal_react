import { useEffect, useRef } from 'react';

// Single-key shortcuts, e.g. { c: openCreate, '/': focusSearch }; a missing or undefined handler means "not available here"
export type ShortcutMap = Partial<Record<string, (() => void) | undefined>>;

// Typing in a field, or working inside a dialog or menu, should never trigger a page shortcut
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return true;
  const target = event.target as HTMLElement | null;
  if (target?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
  return !!document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]');
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, enabled = true) {
  // Kept in a ref so callers can pass a fresh object every render without re-subscribing
  const latest = useRef(shortcuts);
  latest.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;
      const handler = latest.current[event.key.length === 1 ? event.key.toLowerCase() : event.key] ?? latest.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
