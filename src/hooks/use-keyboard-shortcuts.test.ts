import { shouldIgnoreShortcut } from './use-keyboard-shortcuts';

// Dispatches a key press from `target` and reports whether shortcuts would ignore it
function pressFrom(target: EventTarget, init: KeyboardEventInit = {}): boolean | undefined {
  let ignored: boolean | undefined;
  const listener = (event: Event) => (ignored = shouldIgnoreShortcut(event as KeyboardEvent));
  document.addEventListener('keydown', listener);
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true, ...init }));
  document.removeEventListener('keydown', listener);
  return ignored;
}

describe('shouldIgnoreShortcut()', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('allows a plain key press on the page', () => {
    expect(pressFrom(document.body)).toBe(false);
  });

  it('ignores typing in fields and modifier combinations', () => {
    document.body.innerHTML = '<input id="field" /><textarea id="notes"></textarea>';
    expect(pressFrom(document.getElementById('field')!)).toBe(true);
    expect(pressFrom(document.getElementById('notes')!)).toBe(true);
    expect(pressFrom(document.body, { ctrlKey: true })).toBe(true);
    expect(pressFrom(document.body, { metaKey: true })).toBe(true);
  });

  it('ignores keys while a dialog or menu is open', () => {
    document.body.innerHTML = '<div role="dialog"></div>';
    expect(pressFrom(document.body)).toBe(true);
    document.body.innerHTML = '<div role="menu"></div>';
    expect(pressFrom(document.body)).toBe(true);
  });
});
