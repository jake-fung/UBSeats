import { useEffect } from 'react';

/**
 * Calls `onClose` whenever the Escape key is pressed — unless something layered above already
 * handled it. Radix dialogs/popovers dismiss on the same keypress in a capture-phase listener and
 * mark the event `defaultPrevented`; without this check one Esc would close the note popup *and*
 * the building panel underneath it.
 */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}
