import { ReactElement, ReactNode, useMemo, useState } from 'react';
import { render, RenderResult } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SelectedDateContext } from '@/hooks/useSelectedDate';

interface Options {
  /** Initial selected day ("YYYY-MM-DD"); null or omitted means today. */
  selectedKey?: string | null;
}

/** Renders `ui` inside the same providers as App.tsx. */
export function renderWithProviders(ui: ReactElement, opts: Options = {}): RenderResult & { user: UserEvent } {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const Providers = ({ children }: { children: ReactNode }) => {
    const [selectedKey, setSelectedKey] = useState<string | null>(opts.selectedKey ?? null);
    const value = useMemo(() => ({ selectedKey, setSelectedKey }), [selectedKey]);
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SelectedDateContext.Provider value={value}>{children}</SelectedDateContext.Provider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  };

  // Not inlined into the return: the annotated return type would contextually type render's
  // generic Q and drop the bound queries from the inferred result.
  const result = render(ui, { wrapper: Providers });
  return { user: userEvent.setup(), ...result };
}
