import { useEffect } from 'react';

export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, meta = false, alt = false, shift = false } = options;

  useEffect(() => {
    const handler = (event) => {
      // Check for modifier keys
      const ctrlOrMeta = ctrl || meta;
      const isCtrlOrMeta = event.ctrlKey || event.metaKey;

      if (ctrlOrMeta && !isCtrlOrMeta) return;
      if (alt && !event.altKey) return;
      if (shift && !event.shiftKey) return;

      if (event.key.toLowerCase() === key.toLowerCase()) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, ctrl, meta, alt, shift]);
}
