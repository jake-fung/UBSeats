import { useEffect, useState } from 'react';

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => window.innerWidth < window.innerHeight);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < window.innerHeight);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}
