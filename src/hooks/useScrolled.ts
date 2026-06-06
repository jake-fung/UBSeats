import { useEffect, useState, type RefObject } from 'react';

/**
 * Tracks whether a scroll container has been scrolled past `threshold` px, so a
 * sticky header can add a shadow/background. Captures the element up front and
 * early-returns when it is absent (the pattern BottomSheet used; BuildingDetail
 * previously bound against a possibly-null ref and could miss the listener).
 *
 * Also resets to top whenever `isOpen` flips to false, so a reopened panel starts
 * unscrolled.
 */
export function useScrolled(ref: RefObject<HTMLElement>, isOpen: boolean, threshold = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleScroll = () => setScrolled(el.scrollTop > threshold);
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref, threshold]);

  useEffect(() => {
    if (!isOpen && ref.current) {
      ref.current.scrollTop = 0;
      setScrolled(false);
    }
  }, [isOpen, ref]);

  return scrolled;
}
