import { ReactNode, useMemo, useState } from 'react';
import { SelectedDateContext } from '@/hooks/useSelectedDate';

export const SelectedDateProvider = ({ children }: { children: ReactNode }) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const value = useMemo(() => ({ selectedKey, setSelectedKey }), [selectedKey]);
  return <SelectedDateContext.Provider value={value}>{children}</SelectedDateContext.Provider>;
};
