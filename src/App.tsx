import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import Index from './pages/Index';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </TooltipProvider>
      <Analytics />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
