import { useEffect, useState } from 'react';
import { BREAKPOINTS } from '@/utils/screenSizeUtils';

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth < BREAKPOINTS.md);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < BREAKPOINTS.md);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}
