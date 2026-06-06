import { useEffect } from 'react';

/** Calls `onClose` whenever the Escape key is pressed. */
export function useEscapeKey(onClose: () => void): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
}
